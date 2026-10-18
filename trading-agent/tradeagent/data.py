"""OHLCV loading, fetching and quality checks.

Timestamp convention (enforced everywhere): a row's index is the bar OPEN time in UTC,
and a bar is only usable once `open_time + timeframe <= now`. The still-forming bar is
always dropped, which is the most common live look-ahead bug.
"""
from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd

COLUMNS = ["open", "high", "low", "close", "volume"]
_UNITS = {"m": 60, "h": 3600, "d": 86400, "w": 604800}


def timeframe_seconds(tf: str) -> int:
    try:
        return int(tf[:-1]) * _UNITS[tf[-1]]
    except (KeyError, ValueError) as exc:
        raise ValueError(f"bad timeframe {tf!r}") from exc


def periods_per_year(tf: str) -> float:
    # crypto trades 365 days a year, 24h a day
    return 365 * 86400 / timeframe_seconds(tf)


@dataclass
class DataReport:
    ok: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def check_quality(df: pd.DataFrame, tf: str, max_jump: float = 0.5) -> DataReport:
    """Reject data that would silently corrupt a backtest."""
    errors, warnings = [], []
    missing = [c for c in COLUMNS if c not in df.columns]
    if missing:
        return DataReport(False, [f"missing columns {missing}"])
    if not isinstance(df.index, pd.DatetimeIndex) or df.index.tz is None:
        errors.append("index must be a tz-aware UTC DatetimeIndex")
    if df.index.has_duplicates:
        errors.append(f"{int(df.index.duplicated().sum())} duplicate timestamps")
    if not df.index.is_monotonic_increasing:
        errors.append("timestamps not sorted ascending")
    if df[COLUMNS].isna().any().any():
        errors.append("NaN values present")
    if (df[["open", "high", "low", "close"]] <= 0).any().any():
        errors.append("non-positive prices")
    bad_hl = (df["high"] < df[["open", "close"]].max(axis=1)) | (df["low"] > df[["open", "close"]].min(axis=1))
    if bad_hl.any():
        errors.append(f"{int(bad_hl.sum())} bars where high/low do not bracket open/close")
    if len(df) > 1 and not errors:
        step = pd.Timedelta(seconds=timeframe_seconds(tf))
        gaps = df.index.to_series().diff().dropna()
        n_gaps = int((gaps > step).sum())
        if n_gaps:
            warnings.append(f"{n_gaps} gaps in the series (exchange downtime or delisting?)")
        jumps = df["close"].pct_change().abs()
        if (jumps > max_jump).any():
            warnings.append(f"{int((jumps > max_jump).sum())} bar-to-bar moves >{max_jump:.0%}: verify they are real")
    return DataReport(not errors, errors, warnings)


def load_csv(path: str | Path) -> pd.DataFrame:
    df = pd.read_csv(path, float_precision="round_trip")
    ts_col = "timestamp" if "timestamp" in df.columns else df.columns[0]
    ts = df[ts_col]
    idx = pd.to_datetime(ts, unit="ms", utc=True) if pd.api.types.is_numeric_dtype(ts) else pd.to_datetime(ts, utc=True)
    out = df[COLUMNS].astype(float)
    out.index = pd.DatetimeIndex(idx, name="timestamp")
    return out.sort_index()


def save_csv(df: pd.DataFrame, path: str | Path) -> None:
    out = df.copy()
    out.index = out.index.strftime("%Y-%m-%dT%H:%M:%SZ")
    out.to_csv(path, index_label="timestamp", float_format="%.17g")  # exact float round-trip


def dataset_hash(df: pd.DataFrame) -> str:
    """Identifies a dataset so the trial registry can count every variant run on it."""
    secs = ((df.index - pd.Timestamp(0, tz="UTC")) // pd.Timedelta(seconds=1)).to_numpy(dtype="int64")
    h = hashlib.sha256(secs.tobytes() + np.ascontiguousarray(df[COLUMNS].to_numpy(dtype="float64")).tobytes())
    return h.hexdigest()[:16]


def drop_unclosed(df: pd.DataFrame, tf: str, now: pd.Timestamp | None = None) -> pd.DataFrame:
    now = now or pd.Timestamp.now(tz="UTC")
    closed = df.index + pd.Timedelta(seconds=timeframe_seconds(tf)) <= now
    return df[closed]


def rows_to_frame(rows: list[list[float]]) -> pd.DataFrame:
    if not rows:
        return pd.DataFrame(columns=COLUMNS, index=pd.DatetimeIndex([], tz="UTC", name="timestamp"))
    arr = np.asarray(rows, dtype=float)
    idx = pd.DatetimeIndex(pd.to_datetime(arr[:, 0], unit="ms", utc=True), name="timestamp")
    df = pd.DataFrame(arr[:, 1:6], index=idx, columns=COLUMNS)
    return df[~df.index.duplicated(keep="last")].sort_index()


def fetch_ohlcv(exchange_id: str, symbol: str, tf: str, since: str = "2017-01-01",
                limit: int = 720, exchange=None) -> pd.DataFrame:
    """Paginated download through ccxt's documented `fetch_ohlcv`. Public endpoint, no keys."""
    if exchange is None:
        import ccxt  # optional dependency

        exchange = getattr(ccxt, exchange_id)({"enableRateLimit": True})
    since_ms = int(pd.Timestamp(since, tz="UTC").timestamp() * 1000)
    step_ms = timeframe_seconds(tf) * 1000
    rows: list[list[float]] = []
    while True:
        batch = exchange.fetch_ohlcv(symbol, tf, since=since_ms, limit=limit)
        if not batch:
            break
        rows.extend(batch)
        next_since = int(batch[-1][0]) + step_ms
        if next_since <= since_ms or len(batch) < 2:
            break
        since_ms = next_since
        if since_ms > time.time() * 1000:
            break
    return drop_unclosed(rows_to_frame(rows), tf)


def synthetic_ohlcv(n: int = 1500, seed: int = 0, tf: str = "1d", drift: float = 0.0003,
                    vol: float = 0.035, start: str = "2018-01-01") -> pd.DataFrame:
    """SYNTHETIC random-walk data for TESTS ONLY. Never use for performance claims."""
    rng = np.random.default_rng(seed)
    rets = rng.normal(drift, vol, n)
    close = 10_000 * np.exp(np.cumsum(rets))
    open_ = np.concatenate([[10_000], close[:-1]]) * (1 + rng.normal(0, 0.001, n))
    high = np.maximum(open_, close) * (1 + np.abs(rng.normal(0, 0.01, n)))
    low = np.minimum(open_, close) * (1 - np.abs(rng.normal(0, 0.01, n)))
    vol_ = rng.lognormal(10, 0.5, n)
    idx = pd.date_range(start, periods=n, freq=pd.Timedelta(seconds=timeframe_seconds(tf)), tz="UTC", name="timestamp")
    return pd.DataFrame({"open": open_, "high": high, "low": low, "close": close, "volume": vol_}, index=idx)
