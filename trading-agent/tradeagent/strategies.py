"""Candidate strategies. Each one only emits a causal long/flat SIGNAL (0 or 1) at bar close.
Sizing, risk and execution live elsewhere so a strategy can never place or size an order.

Long-only spot by design: no leverage, no liquidation risk, no funding payments, no
borrow. That gives up the short side; it buys survival.
"""
from __future__ import annotations

import itertools
from dataclasses import dataclass, field
from typing import Callable

import numpy as np
import pandas as pd

from .indicators import atr, rolling_high, rolling_low, rsi, sma


@dataclass(frozen=True)
class Strategy:
    name: str
    edge: str              # the edge in one sentence
    counterparty: str      # who is on the other side
    entry: str
    exit: str
    stop: str
    holding_period: str
    why_persist: str
    grid: dict[str, list]
    fn: Callable[[pd.DataFrame, dict], pd.Series] = field(repr=False)
    benchmark: bool = False

    def signal(self, df: pd.DataFrame, params: dict) -> pd.Series:
        s = self.fn(df, params).astype(float).fillna(0.0).clip(0, 1)
        s.name = self.name
        return s

    def param_sets(self) -> list[dict]:
        keys = list(self.grid)
        return [dict(zip(keys, combo)) for combo in itertools.product(*(self.grid[k] for k in keys))]

    def neighbors(self, params: dict) -> list[dict]:
        """Parameter sets one grid step away in a single dimension."""
        out = []
        for k, values in self.grid.items():
            i = values.index(params[k])
            for j in (i - 1, i + 1):
                if 0 <= j < len(values):
                    out.append({**params, k: values[j]})
        return out


def _with_trailing_stop(df: pd.DataFrame, entry: pd.Series, exit_: pd.Series, atr_mult: float, atr_n: int = 14) -> pd.Series:
    """Stateful long/flat machine: enter on entry, leave on exit or on a close below
    highest-close-since-entry minus atr_mult*ATR. All decided at the bar close."""
    a = atr(df, atr_n).to_numpy()
    close = df["close"].to_numpy()
    en, ex = entry.to_numpy(dtype=bool), exit_.to_numpy(dtype=bool)
    out = np.zeros(len(df))
    in_pos, peak = False, 0.0
    for t in range(len(df)):
        if in_pos:
            peak = max(peak, close[t])
            stopped = np.isfinite(a[t]) and close[t] < peak - atr_mult * a[t]
            if ex[t] or stopped:
                in_pos = False
        elif en[t] and np.isfinite(a[t]):
            in_pos, peak = True, close[t]
        out[t] = 1.0 if in_pos else 0.0
    return pd.Series(out, index=df.index)


def _trend_ma(df, p):
    c = df["close"]
    fast, slow = sma(c, p["fast"]), sma(c, p["slow"])
    up = (fast > slow) & (c > slow)
    return _with_trailing_stop(df, up, ~up & slow.notna(), p["atr_stop"])


def _donchian(df, p):
    c = df["close"]
    entry = c > rolling_high(df["high"], p["entry_n"])
    exit_ = c < rolling_low(df["low"], p["exit_n"])
    return _with_trailing_stop(df, entry, exit_, p["atr_stop"])


def _tsmom(df, p):
    c = df["close"]
    mom = c / c.shift(p["lookback"]) - 1
    return (mom > 0).astype(float).where(mom.notna(), 0.0)


def _rsi_dip(df, p):
    """Buy short-term oversold dips only inside a long-term uptrend; exit on bounce or time."""
    c = df["close"]
    r = rsi(c, p["rsi_n"]).to_numpy()
    trend = (c > sma(c, 200)).to_numpy()
    exit_ma = sma(c, 5).to_numpy()
    close = c.to_numpy()
    out = np.zeros(len(df))
    held = -1
    for t in range(len(df)):
        if held >= 0:
            held += 1
            if close[t] > exit_ma[t] or held >= p["max_hold"] or not trend[t]:
                held = -1
        elif trend[t] and np.isfinite(r[t]) and r[t] < p["rsi_th"]:
            held = 0
        out[t] = 1.0 if held >= 0 else 0.0
    return pd.Series(out, index=df.index)


def _buy_hold(df, p):
    return pd.Series(1.0, index=df.index)


CANDIDATES: list[Strategy] = [
    Strategy(
        name="trend_ma",
        edge="Crypto trends persist because information diffuses slowly and flows chase performance.",
        counterparty="Early profit-takers and mean-reversion sellers who fade strong moves.",
        entry="Fast SMA > slow SMA and close > slow SMA, at bar close; filled next bar open.",
        exit="Trend condition fails at bar close.",
        stop="Close below (highest close since entry - atr_stop x ATR14).",
        holding_period="Weeks to months",
        why_persist="Behavioural (herding, anchoring) and structural (trend-following funds add to winners); "
                    "documented in time-series momentum literature across asset classes.",
        grid={"fast": [10, 20, 30, 50], "slow": [100, 150, 200], "atr_stop": [2.5, 3.5, 5.0]},
        fn=_trend_ma,
    ),
    Strategy(
        name="donchian",
        edge="Breakouts to new N-bar highs in crypto tend to continue more than they reverse.",
        counterparty="Range traders selling resistance and holders taking profit at round-number highs.",
        entry="Close above the prior entry_n-bar high.",
        exit="Close below the prior exit_n-bar low.",
        stop="Close below (highest close since entry - atr_stop x ATR14).",
        holding_period="Weeks",
        why_persist="Same behavioural driver as trend; breakouts also trigger stop-buy and short-covering cascades.",
        grid={"entry_n": [20, 40, 55, 80], "exit_n": [10, 20, 30], "atr_stop": [2.5, 3.5, 5.0]},
        fn=_donchian,
    ),
    Strategy(
        name="tsmom",
        edge="Assets with positive trailing return keep outperforming cash over the next period.",
        counterparty="Contrarians and value-anchored sellers.",
        entry="Trailing `lookback`-bar return > 0.",
        exit="Trailing return <= 0.",
        stop="None beyond the signal flip; risk is controlled by vol-target sizing and portfolio limits.",
        holding_period="Weeks to months",
        why_persist="Moskowitz, Ooi & Pedersen (2012) time-series momentum; slow-moving capital.",
        grid={"lookback": [30, 60, 90, 120, 180]},
        fn=_tsmom,
    ),
    Strategy(
        name="rsi_dip",
        edge="Short-term oversold dips inside a long-term uptrend snap back as liquidity providers are paid.",
        counterparty="Forced or panicked sellers (liquidations, stop-outs) who need immediacy.",
        entry="RSI(rsi_n) < rsi_th and close > SMA200.",
        exit="Close > SMA5, or after max_hold bars, or trend filter fails.",
        stop="Time stop (max_hold) + trend-filter exit; no price stop (dip buying would be stopped at the low).",
        holding_period="Days",
        why_persist="Compensation for providing liquidity; weakest economic story here and the most "
                    "cost-sensitive because it trades often.",
        grid={"rsi_n": [2, 3, 4], "rsi_th": [5, 10, 15, 20], "max_hold": [5, 10]},
        fn=_rsi_dip,
    ),
    Strategy(
        name="buy_hold",
        edge="Benchmark only - not deployable. Every strategy must beat it on risk-adjusted terms.",
        counterparty="n/a", entry="Always long", exit="Never", stop="None",
        holding_period="Forever", why_persist="n/a", grid={"_": [0]}, fn=_buy_hold, benchmark=True,
    ),
]


def get(name: str) -> Strategy:
    for s in CANDIDATES:
        if s.name == name:
            return s
    raise KeyError(f"unknown strategy {name!r}; choose from {[s.name for s in CANDIDATES]}")
