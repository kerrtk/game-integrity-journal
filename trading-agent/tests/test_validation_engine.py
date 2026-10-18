import json
from dataclasses import replace

import numpy as np
import pandas as pd
import pytest

from tradeagent import backtest, manifest
from tradeagent.broker import PaperBroker, ReplayFeed
from tradeagent.config import Live
from tradeagent.data import periods_per_year, synthetic_ohlcv, timeframe_seconds
from tradeagent.engine import HISTORY_BARS, Engine
from tradeagent.registry import TrialRegistry
from tradeagent.strategies import CANDIDATES, get
from tradeagent.validation import PAPER_TRADE, REJECT, evaluate, target_weights

STEP = pd.Timedelta(days=1)


@pytest.mark.parametrize("seed", [11, 12, 13])
def test_no_edge_in_pure_noise(cfg, tmp_path, seed):
    """Zero-drift random walks contain no edge. The gauntlet must not deploy anything."""
    df = synthetic_ohlcv(n=2500, seed=seed, drift=0.0)
    reg = TrialRegistry(tmp_path / "trials.jsonl")
    verdicts = [evaluate(df, s, cfg, reg).verdict for s in CANDIDATES if not s.benchmark]
    assert PAPER_TRADE not in verdicts, verdicts


def test_registry_counts_every_variant_once(cfg, tmp_path):
    df = synthetic_ohlcv(n=1500, seed=5)
    reg = TrialRegistry(tmp_path / "t.jsonl")
    s = get("tsmom")
    ev = evaluate(df, s, cfg, reg)
    assert ev.n_trials_dataset == len(s.param_sets())
    evaluate(df, s, cfg, reg)  # re-running the same variants is not new trials
    assert len(reg.trials(ev.dataset)) == len(s.param_sets())
    evaluate(df, get("trend_ma"), cfg, reg)
    assert len(reg.trials(ev.dataset)) == len(s.param_sets()) + len(get("trend_ma").param_sets())


def test_evaluation_report_fields(cfg, tmp_path):
    df = synthetic_ohlcv(n=1500, seed=6)
    ev = evaluate(df, get("trend_ma"), cfg, TrialRegistry(tmp_path / "t.jsonl"))
    doc = json.loads(ev.to_json())
    for key in ("holdout", "holdout_stressed", "deflated_sharpe", "walk_forward", "kill_criteria",
                "mc_drawdown_99", "regime_breakdown"):
        assert key in doc
    assert ev.holdout_stressed["sharpe"] <= ev.holdout["sharpe"] + 1e-12
    assert ev.kill_criteria["max_drawdown"] <= cfg.risk.max_drawdown_pct


# ---- engine ------------------------------------------------------------------------------

def _manifest(df, cfg, tmp_path, name="trend_ma"):
    ev = evaluate(df, get(name), cfg, TrialRegistry(tmp_path / "t.jsonl"))
    ev.verdict = PAPER_TRADE  # TEST ONLY: force deployable so the engine can be exercised
    path = manifest.write(ev, tmp_path / "dep")
    manifest.approve(path, "paper", "test")
    return manifest.load(path)


def _engine(df, cfg, tmp_path, live=False, cash=10_000.0):
    doc = _manifest(df, cfg, tmp_path)
    feed = ReplayFeed(df, spread=0.0)
    broker = PaperBroker("BTC/USD", feed, tmp_path / "acct.json", cfg.costs.fee_rate, cfg.costs.slippage_rate, cash)
    return Engine(cfg, doc, broker, live=live), feed, broker, doc


def test_unapproved_manifest_refused(cfg, tmp_path, df):
    ev = evaluate(df, get("tsmom"), cfg, TrialRegistry(tmp_path / "t.jsonl"))
    ev.verdict = REJECT
    path = manifest.write(ev, tmp_path / "dep")
    with pytest.raises(manifest.ManifestError):
        manifest.approve(path, "paper", "x")
    ev.verdict = PAPER_TRADE
    path = manifest.write(ev, tmp_path / "dep")
    with pytest.raises(manifest.ManifestError):
        manifest.require_approved(manifest.load(path), "paper")
    manifest.approve(path, "paper", "x")
    with pytest.raises(manifest.ManifestError, match="paper-traded"):
        manifest.approve(path, "live", "x", paper_bars=3)


def test_engine_replay_matches_backtest(cfg, tmp_path):
    """The live engine, driven bar by bar, must reproduce the research backtest."""
    df = synthetic_ohlcv(n=1200, seed=21, drift=0.001)
    cfg = replace(cfg, risk=replace(cfg.risk, max_position_notional=1e12, max_orders_per_day=100,
                                    max_daily_loss_pct=0.5, max_drawdown_pct=0.9))
    eng, feed, broker, doc = _engine(df, cfg, tmp_path)
    equity = []
    for ts in df.index[HISTORY_BARS:-1]:
        feed.now = ts
        res = eng.step(now=ts + STEP + pd.Timedelta(seconds=1))
        assert res in ("hold", "filled"), res
        cash, qty = broker.balances()
        equity.append(cash + qty * df["close"].loc[ts])
    eng_ret = pd.Series(equity, index=df.index[HISTORY_BARS:-1]).pct_change().dropna()

    ppy = periods_per_year("1d")
    strat = get(doc["strategy"])
    # backtest on the same window the engine saw (engine only sees the last HISTORY_BARS bars,
    # so compare after enough warm-up for both)
    bt = backtest.run(df, target_weights(df, strat, doc["params"], cfg, ppy, doc["kelly_cap"]),
                      cfg.costs.per_side - cfg.costs.half_spread_rate, ppy)
    # engine equity at close t holds the position filled at open t, same as backtest bar t
    bt_ret = bt.returns.reindex(eng_ret.index).dropna()
    common = eng_ret.index.intersection(bt_ret.index)[50:]
    corr = np.corrcoef(eng_ret.loc[common], bt_ret.loc[common])[0, 1]
    assert corr > 0.97, corr
    assert abs((1 + eng_ret.loc[common]).prod() - (1 + bt_ret.loc[common]).prod()) < 0.05


def test_kill_switch_flattens_and_halts(cfg, tmp_path):
    df = synthetic_ohlcv(n=900, seed=21, drift=0.002)
    eng, feed, broker, _ = _engine(df, cfg, tmp_path)
    for ts in df.index[HISTORY_BARS:HISTORY_BARS + 200]:
        feed.now = ts
        eng.step(now=ts + STEP + pd.Timedelta(seconds=1))
        if broker.balances()[1] > 0:
            break
    assert broker.balances()[1] > 0, "expected a long position before testing the kill switch"
    eng.kill_file.write_text("test")
    assert eng.step(now=feed.now + STEP + pd.Timedelta(seconds=2)) == "killed"
    assert broker.balances()[1] == 0
    assert eng.risk.state.halted and eng.risk.state.halt_kind == "sticky"
    events = [r["event"] for r in eng.journal.read()]
    assert "kill_switch" in events and "order_filled" in events


def test_stale_data_blocks_trading_and_trips_breaker(cfg, tmp_path):
    df = synthetic_ohlcv(n=900, seed=3)
    eng, feed, broker, _ = _engine(df, cfg, tmp_path)
    feed.now = df.index[600]
    much_later = df.index[600] + pd.Timedelta(days=10)
    for _ in range(cfg.risk.max_api_errors):
        assert eng.step(now=much_later) == "error"
    assert eng.risk.state.halted
    assert broker.balances() == (10_000.0, 0.0)


def test_live_entries_wait_for_human_approval(cfg, tmp_path):
    df = synthetic_ohlcv(n=900, seed=21, drift=0.002)
    cfg = replace(cfg, mode="live", live=Live(capital_cap=1000.0))
    eng, feed, broker, _ = _engine(df, cfg, tmp_path, live=True)
    status = None
    for ts in df.index[HISTORY_BARS:HISTORY_BARS + 200]:
        feed.now = ts
        status = eng.step(now=ts + STEP + pd.Timedelta(seconds=1))
        if status == "awaiting_approval":
            break
    assert status == "awaiting_approval"
    assert broker.balances()[1] == 0  # nothing bought without approval
    req = eng.gate.pending()[0]
    eng.gate.approve(req["id"], "tk")
    assert eng.step(now=feed.now + STEP + pd.Timedelta(seconds=5)) == "filled"
    cash, qty = broker.balances()
    assert qty > 0 and qty * df["close"].loc[feed.now] <= 1000.0 * 1.06  # capital cap respected


def test_api_exceptions_are_contained(cfg, tmp_path, df):
    eng, feed, broker, _ = _engine(df, cfg, tmp_path)

    def boom(*a, **k):
        raise ConnectionError("exchange down")

    broker.feed.ohlcv = boom
    assert eng.step(now=df.index[600]) == "error"
    assert any(r["event"] == "error" for r in eng.journal.read())
