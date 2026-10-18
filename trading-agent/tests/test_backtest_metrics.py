import math

import numpy as np
import pandas as pd
import pytest

from tradeagent import backtest
from tradeagent.metrics import (deflated_sharpe, expected_max_sharpe, max_drawdown,
                                probabilistic_sharpe, sharpe, trade_stats)


def _frame(opens, closes):
    idx = pd.date_range("2020-01-01", periods=len(opens), freq="D", tz="UTC")
    o, c = np.array(opens, float), np.array(closes, float)
    return pd.DataFrame({"open": o, "high": np.maximum(o, c), "low": np.minimum(o, c), "close": c,
                         "volume": 1.0}, index=idx)


def test_next_bar_execution_and_costs():
    df = _frame([100, 100, 110, 121, 121], [100, 110, 121, 121, 121])
    target = pd.Series([1, 1, 0, 0, 0], index=df.index, dtype=float)  # long decided at close of bar 0
    res = backtest.run(df, target, cost_per_side=0.01, ppy=365, rebalance_band=0)
    # bar0: flat. bar1: buy at open 100 (cost 1%), close 110 -> +10%. bar2: hold 110->121.
    # bar3: exit at open 121 (cost 1%). bar4 flat.
    assert res.positions.tolist() == [0, 1, 1, 0, 0]
    assert res.returns.iloc[0] == 0
    assert res.returns.iloc[1] == pytest.approx(0.10 - 0.01)
    assert res.returns.iloc[2] == pytest.approx(0.10)
    assert res.returns.iloc[3] == pytest.approx(-0.01)
    assert len(res.trades) == 1
    assert res.trades[0] == pytest.approx(1.09 * 1.10 * 0.99 - 1)


def test_signal_on_last_bar_cannot_trade_same_bar():
    df = _frame([100, 100, 100], [100, 100, 200])
    target = pd.Series([0, 0, 1], index=df.index, dtype=float)
    res = backtest.run(df, target, 0.0, 365)
    assert res.returns.sum() == 0  # the 100% jump on bar 2 is not captured


def test_buy_and_hold_zero_cost_matches_price(df):
    target = pd.Series(1.0, index=df.index)
    res = backtest.run(df, target, 0.0, 365)
    equity = (1 + res.returns).prod()
    assert equity == pytest.approx(df["close"].iloc[-1] / df["open"].iloc[1], rel=1e-9)


def test_costs_reduce_returns(df):
    rng = np.random.default_rng(0)
    target = pd.Series(rng.integers(0, 2, len(df)).astype(float), index=df.index)
    cheap = backtest.run(df, target, 0.0, 365).returns.sum()
    dear = backtest.run(df, target, 0.005, 365).returns.sum()
    assert dear < cheap


def test_rebalance_decision():
    assert backtest.rebalance_decision(0.5, 0.55, 0.10) == 0.5
    assert backtest.rebalance_decision(0.5, 0.62, 0.10) == 0.62
    assert backtest.rebalance_decision(0.05, 0.0, 0.10) == 0.0   # exits always go through
    assert backtest.rebalance_decision(0.0, 0.05, 0.10) == 0.05  # entries always go through


def test_weight_drifts_between_rebalances():
    df = _frame([100, 100, 200, 200], [100, 200, 200, 200])
    target = pd.Series(0.5, index=df.index)
    res = backtest.run(df, target, 0.0, 365, rebalance_band=0.5)
    # 50% in at bar1 open; price doubles -> weight drifts to 2/3, band too wide to trim
    assert res.returns.iloc[1] == pytest.approx(0.5)
    assert res.returns.iloc[2] == 0 and res.positions.iloc[2] == pytest.approx(2 / 3)


def test_sharpe_and_drawdown():
    r = pd.Series([0.01, -0.01] * 50)
    assert sharpe(r, 365) == pytest.approx(0.0)
    assert max_drawdown(pd.Series([0.1, -0.5, 0.2])) == pytest.approx(0.5)
    assert sharpe(pd.Series([0.0, 0.0]), 365) == 0.0


def test_trade_stats():
    wr, pf = trade_stats([0.1, -0.05, 0.2, -0.05])
    assert wr == 0.5 and pf == pytest.approx(3.0)


def test_psr_and_deflation():
    rng = np.random.default_rng(3)
    r = pd.Series(rng.normal(0.001, 0.01, 1000))
    psr = probabilistic_sharpe(r)
    assert 0.5 < psr <= 1
    trials = list(rng.normal(0, 0.05, 200))
    assert deflated_sharpe(r, trials) < psr
    assert expected_max_sharpe(trials[:10]) < expected_max_sharpe(trials)
    assert expected_max_sharpe([0.1]) == 0.0
    assert math.isfinite(probabilistic_sharpe(pd.Series([0.0] * 10)))
