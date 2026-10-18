"""Research pipeline: every candidate goes through the same gauntlet and gets a verdict.

  1. time split: train | embargo | holdout (never random)
  2. full parameter sweep on TRAIN only, every variant logged to the trial registry
  3. neighbourhood robustness: reject a best setting whose neighbours don't work
  4. Deflated Sharpe of the selected variant vs. ALL variants tried on this dataset
  5. single holdout evaluation at 1x and stressed costs
  6. anchored walk-forward re-optimisation (out-of-sample folds)
  7. regime breakdown, block-bootstrap drawdown distribution, buy & hold comparison
"""
from __future__ import annotations

import json
import math
from dataclasses import asdict, dataclass, field

import numpy as np
import pandas as pd

from . import backtest
from .config import Config
from .data import dataset_hash, periods_per_year
from .metrics import (Stats, block_bootstrap_drawdowns, deflated_sharpe, expected_max_sharpe,
                      probabilistic_sharpe, sharpe, summarize)
from .registry import TrialRegistry
from .regime import label, stay_out_mask
from .sizing import kelly_weight, vol_target_weights
from .strategies import Strategy

REJECT, WATCHLIST, PAPER_TRADE, BENCHMARK = "REJECT", "WATCHLIST", "PAPER_TRADE", "BENCHMARK"


@dataclass
class Evaluation:
    strategy: str
    dataset: str
    params: dict
    verdict: str
    reasons: list[str]
    train: dict
    holdout: dict
    holdout_stressed: dict
    benchmark_holdout: dict
    n_trials_dataset: int
    n_variants_strategy: int
    deflated_sharpe: float
    holdout_psr: float
    neighbor_positive: float
    walk_forward: dict
    regime_breakdown: dict
    mc_drawdown_95: float
    mc_drawdown_99: float
    kelly_cap: float
    trades_per_year: float
    split: dict
    kill_criteria: dict = field(default_factory=dict)

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2, default=_jsonable)


def _jsonable(o):
    if isinstance(o, (np.floating, np.integer)):
        return o.item()
    if isinstance(o, float) and not math.isfinite(o):
        return str(o)
    return str(o)


def target_weights(df: pd.DataFrame, strat: Strategy, params: dict, cfg: Config, ppy: float,
                   kelly_cap: float | None = None) -> pd.Series:
    """Signal -> stay-out filter -> vol-target sizing. Identical code path for research and live."""
    sig = strat.signal(df, params)
    out = stay_out_mask(df, ppy, cfg.regime.vol_lookback, cfg.regime.vol_stay_out_pct)
    sig = sig.where(~out, 0.0)
    if strat.benchmark:
        return sig
    return vol_target_weights(df, sig, ppy, cfg.sizing.target_annual_vol,
                              cfg.sizing.max_position_weight, kelly_cap, cfg.regime.vol_lookback)


def split_indices(n: int, holdout_fraction: float, embargo: int) -> tuple[slice, slice]:
    h = int(n * holdout_fraction)
    train_end = n - h - embargo
    if train_end < 200 or h < 50:
        raise ValueError(f"not enough data to split: {n} bars")
    return slice(0, train_end), slice(n - h, n)


def _seg(res: backtest.Result, sl: slice, ppy: float) -> Stats:
    r, p = res.returns.iloc[sl], res.positions.iloc[sl]
    return summarize(r, p, backtest.extract_trades(p, r), ppy)


def _walk_forward(df, strat, cfg, ppy, cost, results: dict[str, backtest.Result], folds: int) -> dict:
    """Anchored walk-forward: pick best params on [0, k) chunks, trade chunk k with them."""
    n = len(df)
    edges = np.linspace(0, n, folds + 2).astype(int)
    oos, fold_sr = [], []
    for k in range(1, folds + 1):
        ins, outs = slice(0, edges[k]), slice(edges[k], edges[k + 1])
        best = max(results, key=lambda key: sharpe(results[key].returns.iloc[ins], ppy))
        r = results[best].returns.iloc[outs]
        oos.append(r)
        fold_sr.append(sharpe(r, ppy))
    oos_all = pd.concat(oos)
    return {"fold_sharpes": fold_sr, "oos_sharpe": sharpe(oos_all, ppy),
            "positive_folds": int(sum(s > 0 for s in fold_sr)), "folds": folds}


def _regimes(df, returns: pd.Series, ppy: float, cfg: Config) -> dict:
    lab = label(df, ppy, cfg.regime.vol_lookback, cfg.regime.trend_lookback).loc[returns.index]
    out = {}
    for (trend, vol), r in returns.groupby([lab["trend"], lab["vol"]]):
        if trend == "warmup":
            continue
        out[f"{trend}/{vol}"] = {"bars": int(len(r)), "sharpe": sharpe(r, ppy),
                                 "ann_return": float(r.mean() * ppy)}
    return out


def evaluate(df: pd.DataFrame, strat: Strategy, cfg: Config, registry: TrialRegistry,
             dataset: str | None = None) -> Evaluation:
    ppy = periods_per_year(cfg.venue.timeframe)
    dataset = dataset or dataset_hash(df)
    cost = cfg.costs.per_side
    v = cfg.validation
    tr, ho = split_indices(len(df), v.holdout_fraction, v.embargo_bars)

    # 2. sweep on TRAIN only; log every variant (deduplicated per strategy+params)
    results: dict[str, backtest.Result] = {}
    train_sr: dict[str, float] = {}
    seen = {(t["strategy"], json.dumps(t["params"], sort_keys=True)) for t in registry.trials(dataset)}
    for params in strat.param_sets():
        key = json.dumps(params, sort_keys=True)
        res = backtest.run(df, target_weights(df, strat, params, cfg, ppy), cost, ppy)
        results[key] = res
        train_sr[key] = sharpe(res.returns.iloc[tr], ppy)
        if (strat.name, key) not in seen:
            per_period = train_sr[key] / math.sqrt(ppy)
            registry.record(dataset, strat.name, params, per_period, train_sharpe_ann=train_sr[key])

    best_key = max(train_sr, key=train_sr.get)
    params = json.loads(best_key)
    best = results[best_key]

    # 3. neighbourhood robustness
    nbrs = [json.dumps(p, sort_keys=True) for p in strat.neighbors(params)]
    neighbor_positive = float(np.mean([train_sr[k] > 0 for k in nbrs])) if nbrs else 1.0

    # 4. deflated Sharpe vs every variant on this dataset
    all_sr = registry.sharpes(dataset)
    dsr = deflated_sharpe(best.returns.iloc[tr], all_sr)

    # Kelly cap from TRAIN, then the (possibly capped) final run for holdout
    unit = backtest.run(df, strat.signal(df, params), cost, ppy).returns.iloc[tr]
    kelly_cap = kelly_weight(unit, cfg.sizing.kelly_fraction) if not strat.benchmark else 1.0
    final_target = target_weights(df, strat, params, cfg, ppy,
                                  None if strat.benchmark else kelly_cap)
    final = backtest.run(df, final_target, cost, ppy)
    stressed = backtest.run(df, final_target, cost * v.cost_stress_multiplier, ppy)

    train_stats, hold_stats = _seg(final, tr, ppy), _seg(final, ho, ppy)
    stress_stats = _seg(stressed, ho, ppy)
    hold_psr = probabilistic_sharpe(final.returns.iloc[ho])

    bh = backtest.run(df, pd.Series(1.0, index=df.index), cost, ppy)
    bh_stats = _seg(bh, ho, ppy)

    wf = _walk_forward(df, strat, cfg, ppy, cost, results, v.walk_forward_folds)
    live_ret = final.returns.iloc[max(cfg.regime.trend_lookback, 0):]
    mc = block_bootstrap_drawdowns(live_ret, v.mc_paths, v.mc_block)
    years_train = train_stats.n_bars / ppy
    tpy = train_stats.n_trades / years_train if years_train else 0.0

    # 7. verdict
    reasons: list[str] = []
    hard_fail = False
    if strat.benchmark:
        verdict = BENCHMARK
    else:
        checks = [
            (hold_stats.sharpe <= 0, f"holdout Sharpe {hold_stats.sharpe:.2f} <= 0"),
            (stress_stats.sharpe <= 0, f"Sharpe at {v.cost_stress_multiplier:g}x costs {stress_stats.sharpe:.2f} <= 0"),
            (neighbor_positive < v.min_neighbor_positive,
             f"only {neighbor_positive:.0%} of neighbouring params profitable (fragile / curve-fit)"),
            (wf["oos_sharpe"] <= 0, f"walk-forward OOS Sharpe {wf['oos_sharpe']:.2f} <= 0"),
            (wf["positive_folds"] < math.ceil(wf["folds"] / 2),
             f"only {wf['positive_folds']}/{wf['folds']} walk-forward folds positive"),
            (kelly_cap <= 0, "no positive in-sample edge (Kelly = 0)"),
        ]
        for failed, why in checks:
            if failed:
                hard_fail = True
                reasons.append(why)
        soft = [
            (dsr < v.dsr_threshold, f"Deflated Sharpe {dsr:.2f} < {v.dsr_threshold} after {len(all_sr)} trials"),
            (hold_stats.n_trades < v.min_holdout_trades,
             f"{hold_stats.n_trades} holdout trades < {v.min_holdout_trades}: not enough evidence"),
            (not (hold_stats.sharpe > bh_stats.sharpe or
                  (hold_stats.max_drawdown <= 0.6 * bh_stats.max_drawdown and hold_stats.sharpe >= 0.8 * bh_stats.sharpe)),
             "does not beat buy & hold on Sharpe or on drawdown"),
        ]
        for failed, why in soft:
            if failed:
                reasons.append(why)
        verdict = REJECT if hard_fail else (WATCHLIST if reasons else PAPER_TRADE)

    per_bar = final.returns.iloc[tr]
    ev = Evaluation(
        strategy=strat.name, dataset=dataset, params=params, verdict=verdict, reasons=reasons,
        train=train_stats.as_dict(), holdout=hold_stats.as_dict(), holdout_stressed=stress_stats.as_dict(),
        benchmark_holdout=bh_stats.as_dict(), n_trials_dataset=len(all_sr),
        n_variants_strategy=len(results), deflated_sharpe=dsr, holdout_psr=hold_psr,
        neighbor_positive=neighbor_positive, walk_forward=wf,
        regime_breakdown=_regimes(df, final.returns.iloc[ho], ppy, cfg),
        mc_drawdown_95=float(np.quantile(mc, 0.95)), mc_drawdown_99=float(np.quantile(mc, 0.99)),
        kelly_cap=kelly_cap, trades_per_year=tpy,
        split={"train": [str(df.index[tr][0]), str(df.index[tr][-1])],
               "holdout": [str(df.index[ho][0]), str(df.index[ho][-1])],
               "luck_bar_sr_per_period": expected_max_sharpe(all_sr)},
    )
    ev.kill_criteria = kill_criteria(ev, float(per_bar.mean()), float(per_bar.std(ddof=1)), cfg)
    return ev


def kill_criteria(ev: Evaluation, mu: float, sd: float, cfg: Config) -> dict:
    """What live result proves the strategy is broken. Checked automatically by the monitor."""
    return {
        "max_drawdown": min(ev.mc_drawdown_99, cfg.risk.max_drawdown_pct),
        "warn_drawdown": min(ev.mc_drawdown_95, cfg.risk.max_drawdown_pct * 0.75),
        "per_bar_mean": mu,
        "per_bar_sd": sd,
        "cone_sigmas": 3.0,  # stop if cumulative live return < mu*n - 3*sd*sqrt(n)
        "max_trades_per_year": 3 * max(ev.trades_per_year, 1.0),
        "max_slippage_ratio": 2.0,  # realised slippage vs assumed
        "assumed_slippage": cfg.costs.slippage_rate + cfg.costs.half_spread_rate,
    }
