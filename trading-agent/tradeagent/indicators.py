"""Causal indicators: every value at bar t uses only data up to and including bar t's close."""
from __future__ import annotations

import math

import numpy as np
import pandas as pd


def sma(s: pd.Series, n: int) -> pd.Series:
    return s.rolling(n, min_periods=n).mean()


def atr(df: pd.DataFrame, n: int) -> pd.Series:
    prev_close = df["close"].shift(1)
    tr = pd.concat([df["high"] - df["low"], (df["high"] - prev_close).abs(), (df["low"] - prev_close).abs()], axis=1).max(axis=1)
    return tr.rolling(n, min_periods=n).mean()


def rsi(s: pd.Series, n: int) -> pd.Series:
    delta = s.diff()
    up = delta.clip(lower=0).ewm(alpha=1 / n, adjust=False, min_periods=n).mean()
    down = (-delta.clip(upper=0)).ewm(alpha=1 / n, adjust=False, min_periods=n).mean()
    rs = up / down.replace(0, np.nan)
    return (100 - 100 / (1 + rs)).fillna(100.0).where(up.notna())


def realized_vol(close: pd.Series, n: int, ppy: float) -> pd.Series:
    return np.log(close).diff().rolling(n, min_periods=n).std() * math.sqrt(ppy)


def rolling_high(s: pd.Series, n: int) -> pd.Series:
    """Highest value of the PRIOR n bars (excludes the current bar)."""
    return s.shift(1).rolling(n, min_periods=n).max()


def rolling_low(s: pd.Series, n: int) -> pd.Series:
    return s.shift(1).rolling(n, min_periods=n).min()
