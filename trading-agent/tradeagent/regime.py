"""Market-regime labels and the 'stay out' filter."""
from __future__ import annotations

import pandas as pd

from .indicators import realized_vol, sma


def label(df: pd.DataFrame, ppy: float, vol_lookback: int = 30, trend_lookback: int = 200) -> pd.DataFrame:
    """Per-bar regime: trend (up/down) x volatility tercile (low/mid/high).
    Vol terciles use an EXPANDING history so no future data defines 'high vol'."""
    close = df["close"]
    trend = (close > sma(close, trend_lookback)).map({True: "up", False: "down"})
    rv = realized_vol(close, vol_lookback, ppy)
    q1 = rv.expanding(min_periods=vol_lookback * 3).quantile(1 / 3)
    q2 = rv.expanding(min_periods=vol_lookback * 3).quantile(2 / 3)
    vol = pd.Series("mid", index=df.index)
    vol[rv <= q1] = "low"
    vol[rv > q2] = "high"
    out = pd.DataFrame({"trend": trend, "vol": vol, "rv": rv})
    out.loc[rv.isna() | q1.isna(), ["trend", "vol"]] = "warmup"
    return out


def stay_out_mask(df: pd.DataFrame, ppy: float, vol_lookback: int = 30, pct: float = 0.95) -> pd.Series:
    """True where the agent must be flat: realized vol above its own historical pct-ile
    (crash / liquidity-trap conditions where spreads and slippage explode)."""
    rv = realized_vol(df["close"], vol_lookback, ppy)
    threshold = rv.expanding(min_periods=vol_lookback * 3).quantile(pct)
    return (rv > threshold).fillna(False)
