"""Position sizing: volatility targeting, capped by fractional Kelly. Never full Kelly."""
from __future__ import annotations

import pandas as pd

from .config import MAX_KELLY_FRACTION
from .indicators import realized_vol


def kelly_weight(strategy_returns: pd.Series, fraction: float) -> float:
    """Fractional Kelly f = fraction * mu / sigma^2 from IN-SAMPLE per-bar returns of the
    unit-sized strategy. Returns 0 for a non-positive edge. Kelly estimates are noisy,
    which is exactly why only a fraction is used and it's only ever a CAP."""
    if not 0 < fraction <= MAX_KELLY_FRACTION:
        raise ValueError(f"kelly fraction must be in (0, {MAX_KELLY_FRACTION}]")
    r = strategy_returns.dropna()
    var = r.var(ddof=1)
    if len(r) < 30 or var <= 0 or r.mean() <= 0:
        return 0.0
    return float(fraction * r.mean() / var)


def vol_target_weights(df: pd.DataFrame, signal: pd.Series, ppy: float, target_vol: float,
                       max_weight: float, kelly_cap: float | None = None, vol_lookback: int = 30) -> pd.Series:
    rv = realized_vol(df["close"], vol_lookback, ppy)
    w = (target_vol / rv).clip(upper=max_weight)
    if kelly_cap is not None:
        w = w.clip(upper=max(kelly_cap, 0.0))
    return (signal * w).fillna(0.0).clip(0, max_weight)
