"""Hard risk limits enforced in code. Nothing upstream (strategy, model, config at runtime)
can override them: every order must pass `RiskManager.check_order`, and the broker is
only reachable through the engine, which calls it unconditionally.

Halts:
  * daily-loss halt  -> clears automatically at the next UTC day
  * drawdown / API errors / kill switch / monitor breach -> STICKY until a human runs `reset`
While halted, only risk-REDUCING orders (selling an existing long) are allowed.
"""
from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path

import pandas as pd

from .config import Risk


@dataclass
class Order:
    symbol: str
    side: str            # "buy" | "sell"
    qty: float
    ref_price: float     # price used for sizing/notional checks
    reason: str
    risk_increasing: bool


@dataclass
class RiskState:
    peak_equity: float = 0.0
    day: str = ""
    day_start_equity: float = 0.0
    halted: bool = False
    halt_kind: str = ""          # "daily" | "sticky"
    halt_reason: str = ""
    orders_today: int = 0
    api_errors: list[float] = field(default_factory=list)


class RiskManager:
    def __init__(self, limits: Risk, path: str | Path, position_cap: float):
        self.limits = limits
        self.path = Path(path)
        self.position_cap = min(position_cap, limits.max_position_notional)
        self.state = self._load()

    # ---- persistence ------------------------------------------------------------------
    def _load(self) -> RiskState:
        if self.path.exists():
            return RiskState(**json.loads(self.path.read_text()))
        return RiskState()

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(asdict(self.state), indent=2))
        tmp.replace(self.path)  # atomic: a crash never leaves half-written risk state

    # ---- halts ------------------------------------------------------------------------
    def halt(self, reason: str, sticky: bool = True) -> None:
        if self.state.halted and self.state.halt_kind == "sticky":
            return  # never downgrade a sticky halt
        self.state.halted, self.state.halt_reason = True, reason
        self.state.halt_kind = "sticky" if sticky else "daily"
        self.save()

    def reset(self) -> None:
        """Human-only. Clears the halt and re-bases the peak so an old drawdown can't
        instantly re-trigger; the drawdown budget restarts from current equity."""
        self.state.halted, self.state.halt_kind, self.state.halt_reason = False, "", ""
        self.state.peak_equity = 0.0
        self.state.api_errors = []
        self.save()

    # ---- checks -----------------------------------------------------------------------
    def update_equity(self, equity: float, now: pd.Timestamp) -> list[str]:
        s, breaches = self.state, []
        day = now.strftime("%Y-%m-%d")
        if s.day != day:
            s.day, s.day_start_equity, s.orders_today = day, equity, 0
            if s.halted and s.halt_kind == "daily":
                s.halted, s.halt_kind, s.halt_reason = False, "", ""
        s.peak_equity = max(s.peak_equity, equity)
        dd = 1 - equity / s.peak_equity if s.peak_equity > 0 else 0.0
        day_loss = 1 - equity / s.day_start_equity if s.day_start_equity > 0 else 0.0
        sticky_halted = s.halted and s.halt_kind == "sticky"
        if dd >= self.limits.max_drawdown_pct and not sticky_halted:
            breaches.append(f"drawdown {dd:.1%} >= limit {self.limits.max_drawdown_pct:.0%}")
            self.halt(breaches[-1], sticky=True)
        elif day_loss >= self.limits.max_daily_loss_pct and not s.halted:
            breaches.append(f"daily loss {day_loss:.1%} >= limit {self.limits.max_daily_loss_pct:.0%}")
            self.halt(breaches[-1], sticky=False)
        self.save()
        return breaches

    def record_api_error(self, now: float | None = None) -> bool:
        now = now if now is not None else time.time()
        window = self.limits.api_error_window_sec
        self.state.api_errors = [t for t in self.state.api_errors if now - t < window] + [now]
        tripped = len(self.state.api_errors) >= self.limits.max_api_errors
        if tripped:
            self.halt(f"{len(self.state.api_errors)} API/data errors in {window}s", sticky=True)
        self.save()
        return tripped

    def is_stale(self, last_bar_open: pd.Timestamp, tf_seconds: int, now: pd.Timestamp) -> bool:
        """Newest CLOSED bar must have closed within `stale_data_bars` bars of now."""
        last_close_time = last_bar_open + pd.Timedelta(seconds=tf_seconds)
        return now - last_close_time > pd.Timedelta(seconds=tf_seconds * self.limits.stale_data_bars)

    def check_order(self, order: Order, held_qty: float, equity: float, last_close: float,
                    min_qty: float = 0.0, min_notional: float = 0.0) -> list[str]:
        """Returns the list of violations; empty list means the order may proceed."""
        v: list[str] = []
        lim = self.limits
        notional = order.qty * order.ref_price
        if order.qty <= 0 or not pd.notna(order.qty):
            v.append("non-positive quantity")
        if order.side not in ("buy", "sell"):
            v.append(f"bad side {order.side!r}")
        if order.side == "sell" and order.qty > held_qty * (1 + 1e-9):
            v.append("sell exceeds holdings (no shorting on spot)")
        if order.risk_increasing != (order.side == "buy"):
            v.append("risk classification mismatch")
        if order.qty < min_qty or notional < min_notional:
            v.append(f"below exchange minimum (qty {order.qty:g} / notional {notional:.2f})")
        if order.risk_increasing:
            if self.state.halted:
                v.append(f"halted: {self.state.halt_reason}")
            if self.state.orders_today >= lim.max_orders_per_day:
                v.append(f"max orders per day ({lim.max_orders_per_day}) reached")
            if last_close > 0 and abs(order.ref_price / last_close - 1) > lim.max_price_deviation:
                v.append(f"price {order.ref_price:.2f} deviates >{lim.max_price_deviation:.0%} from last close")
            post = (held_qty + order.qty) * order.ref_price
            if post > self.position_cap * (1 + 1e-9):
                v.append(f"position notional {post:.2f} > cap {self.position_cap:.2f}")
            if equity > 0 and post > equity * (1 + 1e-9):
                v.append("position would exceed equity (no leverage)")
        return v

    def note_order(self) -> None:
        self.state.orders_today += 1
        self.save()
