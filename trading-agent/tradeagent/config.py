"""Typed configuration loaded from TOML. Validation here is the first risk gate:
an unsafe config refuses to load rather than trading with bad limits."""
from __future__ import annotations

import tomllib
from dataclasses import dataclass, field, fields, is_dataclass
from pathlib import Path
from typing import Any

MAX_KELLY_FRACTION = 0.5  # full Kelly is never allowed


class ConfigError(ValueError):
    pass


@dataclass(frozen=True)
class Venue:
    exchange: str = "kraken"
    symbol: str = "BTC/USD"
    timeframe: str = "1d"
    quote_currency: str = "USD"


@dataclass(frozen=True)
class Costs:
    fee_rate: float = 0.004
    slippage_rate: float = 0.0005
    half_spread_rate: float = 0.0001

    @property
    def per_side(self) -> float:
        return self.fee_rate + self.slippage_rate + self.half_spread_rate


@dataclass(frozen=True)
class Validation:
    holdout_fraction: float = 0.30
    embargo_bars: int = 10
    min_holdout_trades: int = 30
    dsr_threshold: float = 0.95
    cost_stress_multiplier: float = 2.0
    min_neighbor_positive: float = 0.70
    walk_forward_folds: int = 5
    mc_paths: int = 2000
    mc_block: int = 20


@dataclass(frozen=True)
class Regime:
    vol_lookback: int = 30
    vol_stay_out_pct: float = 0.95
    trend_lookback: int = 200


@dataclass(frozen=True)
class Sizing:
    method: str = "vol_target"
    target_annual_vol: float = 0.20
    kelly_fraction: float = 0.25
    max_position_weight: float = 1.0


@dataclass(frozen=True)
class Risk:
    max_position_notional: float = 1000.0
    max_daily_loss_pct: float = 0.03
    max_drawdown_pct: float = 0.15
    stale_data_bars: int = 2
    max_api_errors: int = 5
    api_error_window_sec: int = 900
    max_orders_per_day: int = 6
    max_price_deviation: float = 0.05
    auto_flatten_on_halt: bool = True


@dataclass(frozen=True)
class Live:
    capital_cap: float = 100.0
    require_approval_for_entries: bool = True
    approval_timeout_sec: int = 3600


@dataclass(frozen=True)
class Engine:
    poll_seconds: int = 60
    state_dir: str = "state"
    log_file: str = "state/decisions.jsonl"


@dataclass(frozen=True)
class Config:
    mode: str = "paper"
    venue: Venue = field(default_factory=Venue)
    costs: Costs = field(default_factory=Costs)
    validation: Validation = field(default_factory=Validation)
    regime: Regime = field(default_factory=Regime)
    sizing: Sizing = field(default_factory=Sizing)
    risk: Risk = field(default_factory=Risk)
    live: Live = field(default_factory=Live)
    engine: Engine = field(default_factory=Engine)


def _build(cls: type, data: dict[str, Any]) -> Any:
    known = {f.name: f for f in fields(cls)}
    unknown = set(data) - set(known)
    if unknown:
        raise ConfigError(f"unknown keys in [{cls.__name__.lower()}]: {sorted(unknown)}")
    kwargs = {}
    for name, value in data.items():
        ftype = known[name].default_factory if is_dataclass_factory(known[name]) else None
        kwargs[name] = _build(ftype, value) if ftype is not None and isinstance(value, dict) else value
    return cls(**kwargs)


def is_dataclass_factory(f) -> bool:
    factory = f.default_factory
    return factory is not None and isinstance(factory, type) and is_dataclass(factory)


def validate(cfg: Config) -> Config:
    errs: list[str] = []
    if cfg.mode not in ("paper", "live"):
        errs.append("mode must be 'paper' or 'live'")
    if not 0 < cfg.sizing.kelly_fraction <= MAX_KELLY_FRACTION:
        errs.append(f"sizing.kelly_fraction must be in (0, {MAX_KELLY_FRACTION}] - full Kelly is refused")
    if not 0 < cfg.sizing.max_position_weight <= 1.0:
        errs.append("sizing.max_position_weight must be in (0, 1] (spot, no leverage)")
    if not 0 < cfg.sizing.target_annual_vol <= 1.0:
        errs.append("sizing.target_annual_vol must be in (0, 1]")
    if not 0 < cfg.risk.max_daily_loss_pct < cfg.risk.max_drawdown_pct < 1:
        errs.append("risk: need 0 < max_daily_loss_pct < max_drawdown_pct < 1")
    if cfg.risk.max_position_notional <= 0 or cfg.live.capital_cap <= 0:
        errs.append("risk.max_position_notional and live.capital_cap must be > 0")
    if not 0.05 <= cfg.validation.holdout_fraction <= 0.5:
        errs.append("validation.holdout_fraction must be in [0.05, 0.5]")
    if min(cfg.costs.fee_rate, cfg.costs.slippage_rate, cfg.costs.half_spread_rate) < 0:
        errs.append("costs must be non-negative")
    if cfg.costs.per_side == 0:
        errs.append("costs are all zero - a zero-cost backtest is not allowed")
    if cfg.mode == "live" and not cfg.live.require_approval_for_entries:
        errs.append("live.require_approval_for_entries must stay true")
    if errs:
        raise ConfigError("; ".join(errs))
    return cfg


def load_config(path: str | Path | None = None) -> Config:
    if path is None:
        return validate(Config())
    with open(path, "rb") as fh:
        raw = tomllib.load(fh)
    return validate(_build(Config, raw))
