"""Performance statistics, including the Probabilistic and Deflated Sharpe Ratios
(Bailey & Lopez de Prado, 2012 / 2014) so results are judged against the number of
variants tried, not against zero."""
from __future__ import annotations

import math
from dataclasses import asdict, dataclass
from statistics import NormalDist

import numpy as np
import pandas as pd

_N = NormalDist()
EULER_GAMMA = 0.5772156649015329


@dataclass
class Stats:
    sharpe: float
    cagr: float
    ann_vol: float
    max_drawdown: float
    win_rate: float
    profit_factor: float
    n_trades: int
    exposure: float
    turnover_per_year: float
    n_bars: int

    def as_dict(self) -> dict:
        return asdict(self)


def sharpe(returns: pd.Series, ppy: float) -> float:
    r = returns.dropna()
    sd = r.std(ddof=1)
    if len(r) < 2 or not np.isfinite(sd) or sd == 0:
        return 0.0
    return float(r.mean() / sd * math.sqrt(ppy))


def max_drawdown(returns: pd.Series) -> float:
    """Returned as a positive fraction, e.g. 0.25 = -25% peak to trough."""
    eq = (1 + returns.fillna(0)).cumprod()
    if eq.empty:
        return 0.0
    dd = 1 - eq / eq.cummax()
    return float(dd.max())


def cagr(returns: pd.Series, ppy: float) -> float:
    r = returns.fillna(0)
    if len(r) == 0:
        return 0.0
    total = float((1 + r).prod())
    years = len(r) / ppy
    return total ** (1 / years) - 1 if total > 0 and years > 0 else -1.0


def trade_stats(trade_returns: list[float]) -> tuple[float, float]:
    if not trade_returns:
        return 0.0, 0.0
    t = np.asarray(trade_returns)
    gains, losses = t[t > 0].sum(), -t[t < 0].sum()
    win_rate = float((t > 0).mean())
    pf = float(gains / losses) if losses > 0 else (float("inf") if gains > 0 else 0.0)
    return win_rate, pf


def summarize(returns: pd.Series, positions: pd.Series, trade_returns: list[float], ppy: float) -> Stats:
    win_rate, pf = trade_stats(trade_returns)
    turnover = positions.fillna(0).diff().abs().sum()
    years = max(len(returns) / ppy, 1e-9)
    return Stats(
        sharpe=sharpe(returns, ppy),
        cagr=cagr(returns, ppy),
        ann_vol=float(returns.std(ddof=1) * math.sqrt(ppy)) if len(returns) > 1 else 0.0,
        max_drawdown=max_drawdown(returns),
        win_rate=win_rate,
        profit_factor=pf,
        n_trades=len(trade_returns),
        exposure=float((positions.fillna(0) > 0).mean()) if len(positions) else 0.0,
        turnover_per_year=float(turnover / years),
        n_bars=len(returns),
    )


def probabilistic_sharpe(returns: pd.Series, sr_benchmark: float = 0.0) -> float:
    """P(true per-period Sharpe > sr_benchmark) given sample length, skew and kurtosis."""
    r = returns.dropna()
    n = len(r)
    sd = r.std(ddof=1)
    if n < 3 or sd == 0 or not np.isfinite(sd):
        return 0.0
    sr = r.mean() / sd
    skew = float(r.skew())
    kurt = float(r.kurt()) + 3.0  # pandas gives excess kurtosis
    denom = 1 - skew * sr + (kurt - 1) / 4 * sr**2
    if denom <= 0:
        return 0.0
    return float(_N.cdf((sr - sr_benchmark) * math.sqrt(n - 1) / math.sqrt(denom)))


def expected_max_sharpe(trial_sharpes: list[float]) -> float:
    """Expected max per-period Sharpe among N unskilled trials (the 'luck' bar)."""
    n = len(trial_sharpes)
    if n < 2:
        return 0.0
    var = float(np.var(trial_sharpes, ddof=1))
    if var <= 0:
        return 0.0
    a = _N.inv_cdf(1 - 1 / n)
    b = _N.inv_cdf(1 - 1 / (n * math.e))
    return math.sqrt(var) * ((1 - EULER_GAMMA) * a + EULER_GAMMA * b)


def deflated_sharpe(returns: pd.Series, trial_sharpes: list[float]) -> float:
    """PSR measured against the best Sharpe you'd expect from pure luck after N trials.
    `trial_sharpes` are PER-PERIOD (non-annualised) Sharpes of every variant tried."""
    return probabilistic_sharpe(returns, expected_max_sharpe(trial_sharpes))


def block_bootstrap_drawdowns(returns: pd.Series, paths: int, block: int, seed: int = 7) -> np.ndarray:
    """Max-drawdown distribution from stationary-ish block bootstrap of the return series."""
    r = returns.fillna(0).to_numpy()
    n = len(r)
    if n < block * 2:
        return np.array([max_drawdown(returns)])
    rng = np.random.default_rng(seed)
    n_blocks = math.ceil(n / block)
    out = np.empty(paths)
    for i in range(paths):
        starts = rng.integers(0, n - block, n_blocks)
        sample = np.concatenate([r[s:s + block] for s in starts])[:n]
        eq = np.cumprod(1 + sample)
        out[i] = float((1 - eq / np.maximum.accumulate(eq)).max())
    return out
