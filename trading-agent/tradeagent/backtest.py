"""Bar-based backtester with next-bar execution and explicit costs.

Timing (the core no-look-ahead guarantee):
  * target weight w[t] is computed from data up to the CLOSE of bar t
  * it is filled at the OPEN of bar t+1, paying fee + slippage + half-spread on turnover
  * the gap close[t]->open[t+1] is earned by the OLD position, open->close by the new one
  * between rebalances the weight DRIFTS with price, exactly like a real held quantity,
    instead of being silently (and freely) rebalanced every bar
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from .metrics import Stats, summarize


@dataclass
class Result:
    returns: pd.Series      # net per-bar strategy returns
    positions: pd.Series    # weight actually held during each bar (after the open fill)
    trades: list[float]     # net return of each round trip
    stats: Stats


def rebalance_decision(w_cur: float, target: float, band: float) -> float:
    """The one rebalance rule shared by backtest and live engine. Entries from flat and
    exits to flat always trade; otherwise ignore changes within `band` (fee churn)."""
    if (target == 0) != (w_cur == 0) or abs(target - w_cur) > band:
        return target
    return w_cur


def extract_trades(positions: pd.Series, returns: pd.Series) -> list[float]:
    """Net compounded return of each round trip (flat -> long -> flat). An exit's fill
    and cost land on the first flat bar, so that bar is included. Open trades are marked
    to market at the end of the series."""
    trades: list[float] = []
    in_trade, acc = False, 1.0
    for p, r in zip(positions.to_numpy(), returns.to_numpy()):
        if p > 0 and not in_trade:
            in_trade, acc = True, 1.0
        if in_trade:
            acc *= 1 + r
            if p == 0:
                trades.append(acc - 1)
                in_trade = False
    if in_trade:
        trades.append(acc - 1)
    return trades


def run(df: pd.DataFrame, target: pd.Series, cost_per_side: float, ppy: float,
        rebalance_band: float = 0.10) -> Result:
    tgt = target.reindex(df.index).fillna(0.0).to_numpy(dtype=float)
    o, c = df["open"].to_numpy(), df["close"].to_numpy()
    n = len(df)
    ret, pos = np.zeros(n), np.zeros(n)
    w_close, decided = 0.0, 0.0   # drifted weight at the last close, and the weight to fill next open
    for t in range(n):
        gap = o[t] / c[t - 1] - 1 if t > 0 else 0.0
        intra = c[t] / o[t] - 1
        g = 1 + w_close * gap
        w_open = w_close * (1 + gap) / g if g > 0 else 0.0      # weight drifted overnight
        turnover = abs(decided - w_open)
        ret[t] = g * (1 + decided * intra) - 1 - turnover * cost_per_side
        pos[t] = decided
        k = 1 + decided * intra
        w_close = decided * (1 + intra) / k if k > 0 else 0.0   # weight drifted intrabar
        decided = rebalance_decision(w_close, tgt[t], rebalance_band)  # decided at close t
    r = pd.Series(ret, index=df.index, name="strategy")
    p = pd.Series(pos, index=df.index, name="position")
    trades = extract_trades(p, r)
    return Result(r, p, trades, summarize(r, p, trades, ppy))
