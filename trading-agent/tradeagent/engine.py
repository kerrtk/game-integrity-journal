"""The 24/7 loop. One `step()` = observe -> validate data -> decide once per closed bar ->
risk-check -> approve -> execute -> log -> monitor. Any exception in a step is logged and
counted toward the API-error circuit breaker; the loop itself never dies silently.

Precedence (top wins): kill switch > sticky halt > risk limits > approval > strategy.
"""
from __future__ import annotations

import json
import time
from pathlib import Path

import pandas as pd

from . import strategies
from .approval import ApprovalGate
from .backtest import rebalance_decision
from .broker import Broker, BrokerError
from .config import Config
from .data import check_quality, drop_unclosed, periods_per_year, timeframe_seconds
from .journal import Journal
from .monitor import Monitor
from .risk import Order, RiskManager
from .validation import target_weights

HISTORY_BARS = 400       # enough warm-up for the 200-bar trend filter + expanding vol percentiles
REBALANCE_BAND = 0.10    # identical to the backtest default


class Engine:
    def __init__(self, cfg: Config, manifest: dict, broker: Broker, live: bool):
        self.cfg, self.manifest, self.broker, self.live = cfg, manifest, broker, live
        self.strategy = strategies.get(manifest["strategy"])
        self.params, self.kelly_cap = manifest["params"], manifest["kelly_cap"]
        self.tf = cfg.venue.timeframe
        self.tf_s, self.ppy = timeframe_seconds(self.tf), periods_per_year(self.tf)
        sd = Path(cfg.engine.state_dir)
        self.state_dir = sd
        self.kill_file = sd / "KILL"
        cap = cfg.live.capital_cap if live else cfg.risk.max_position_notional
        self.risk = RiskManager(cfg.risk, sd / "risk.json", cap)
        self.capital_cap = cfg.live.capital_cap if live else float("inf")
        self.gate = ApprovalGate(sd, live, cfg.live.approval_timeout_sec)
        self.journal = Journal(cfg.engine.log_file)
        self.monitor = Monitor(manifest["kill_criteria"], sd / "monitor.json", self.ppy)
        self.meta_path = sd / "engine.json"
        self.meta = json.loads(self.meta_path.read_text()) if self.meta_path.exists() else {"last_bar": None, "last_equity": None}

    # ------------------------------------------------------------------------------------
    def _save_meta(self) -> None:
        self.meta_path.write_text(json.dumps(self.meta))

    def _heartbeat(self, status: str, **kw) -> None:
        (self.state_dir / "heartbeat.json").write_text(json.dumps({"ts": time.time(), "status": status, **kw}, default=str))

    def _execute(self, order: Order, mid: float, bar: str) -> dict | None:
        cash, qty = self.broker.balances()
        lim = self.broker.limits()
        equity = cash + qty * mid
        violations = self.risk.check_order(order, qty, equity, self.meta.get("last_close") or mid,
                                           lim.min_qty, lim.min_notional)
        inputs = {"order": order.__dict__, "held": qty, "equity": equity}
        if violations:
            self.journal.log("order_rejected", inputs, output=violations, result="blocked_by_risk")
            return None
        status, rid = self.gate.request(order, bar)
        if status == "expired":
            self.gate.consume(rid)
            self.journal.log("order_expired", inputs, output=rid, result="not_approved_in_time")
            return None
        if status != "approved":
            self.journal.log("order_awaiting_approval", inputs, output=rid, result=status)
            return None
        fill = self.broker.market_order(order.side, order.qty)
        self.gate.consume(rid)
        if order.risk_increasing:
            self.risk.note_order()
        self.monitor.on_fill(mid, fill.price, opened=order.risk_increasing and qty * mid < lim.min_notional)
        self.journal.log("order_filled", inputs, output=rid, result=fill.__dict__)
        return fill.__dict__

    def flatten(self, reason: str) -> None:
        """Kill switch / halt path: sell the whole position. Bypasses strategy and
        approval (risk-reducing), never bypasses logging."""
        _, qty = self.broker.balances()
        qty = self.broker.round_qty(qty)
        if qty <= 0:
            self.journal.log("flatten", {"reason": reason}, result="already_flat")
            return
        bid, ask = self.broker.quote()
        order = Order(self.broker.symbol, "sell", qty, (bid + ask) / 2, f"flatten: {reason}", False)
        self._execute(order, (bid + ask) / 2, bar=f"flatten-{time.time():.0f}")

    # ------------------------------------------------------------------------------------
    def step(self, now: pd.Timestamp | None = None) -> str:
        now = now or pd.Timestamp.now(tz="UTC")
        try:
            return self._step(now)
        except Exception as exc:  # noqa: BLE001 - every failure is logged and counted
            self.journal.log("error", {"now": now}, output=repr(exc), result="counted")
            if self.risk.record_api_error():
                self.journal.log("halt", output=self.risk.state.halt_reason, result="api_error_breaker")
                if self.cfg.risk.auto_flatten_on_halt:
                    try:
                        self.flatten("api error breaker")
                    except Exception as exc2:  # noqa: BLE001
                        self.journal.log("error", output=repr(exc2), result="flatten_failed")
            self._heartbeat("error", error=repr(exc))
            return "error"

    def _step(self, now: pd.Timestamp) -> str:
        # 1. kill switch: absolute priority
        if self.kill_file.exists():
            if not (self.risk.state.halted and self.risk.state.halt_reason.startswith("KILL")):
                self.risk.halt("KILL switch engaged", sticky=True)
                self.journal.log("kill_switch", result="halted")
            if self.broker.balances()[1] * self.broker.quote()[0] >= self.broker.limits().min_notional:
                self.flatten("kill switch")
            self._heartbeat("killed", halted=True)
            return "killed"

        # 2. data: closed bars only, quality-checked, fresh
        bars = drop_unclosed(self.broker.fetch_ohlcv(self.tf, HISTORY_BARS), self.tf, now)
        report = check_quality(bars, self.tf)
        if not report.ok or len(bars) < 250:
            raise BrokerError(f"bad market data: {report.errors or f'{len(bars)} bars'}")
        last = bars.index[-1]
        if self.risk.is_stale(last, self.tf_s, now):
            raise BrokerError(f"stale data: last closed bar {last} at {now}")

        bid, ask = self.broker.quote()
        mid = (bid + ask) / 2
        cash, qty = self.broker.balances()
        equity = cash + qty * mid

        # 3. hard limits on current equity
        breaches = self.risk.update_equity(equity, now)
        if breaches:
            self.journal.log("halt", {"equity": equity}, output=breaches, result=self.risk.state.halt_kind)
            if self.cfg.risk.auto_flatten_on_halt:
                self.flatten("; ".join(breaches))

        bar_key = str(last)
        if self.meta["last_bar"] == bar_key:
            self._heartbeat("waiting", equity=equity, halted=self.risk.state.halted)
            return "waiting"  # one decision per closed bar

        # 4. monitor: live performance vs research expectations
        if self.meta.get("last_equity"):
            self.monitor.on_bar(equity / self.meta["last_equity"] - 1)
        stops, warns = self.monitor.breaches()
        for w in warns:
            self.journal.log("monitor_warning", output=w)
        if stops and not self.risk.state.halted:
            self.risk.halt("monitor: " + "; ".join(stops), sticky=True)
            self.journal.log("halt", output=stops, result="kill_criteria")
            if self.cfg.risk.auto_flatten_on_halt:
                self.flatten("kill criteria")

        # 5. strategy -> target weight (identical code path to research)
        w_target = float(target_weights(bars, self.strategy, self.params, self.cfg, self.ppy, self.kelly_cap).iloc[-1])
        # capital the agent deploys: never more than equity, the live cap, or the position cap
        capital = min(equity, self.capital_cap, self.risk.position_cap / self.cfg.sizing.max_position_weight)
        lim = self.broker.limits()
        dust = qty * mid < lim.min_notional  # untradeable remainder counts as flat
        w_now = 0.0 if dust or capital <= 0 else qty * mid / capital
        w_new = rebalance_decision(w_now, w_target, REBALANCE_BAND)
        if self.risk.state.halted:
            w_new = min(w_new, w_now)  # halted: may only reduce
        decision = {"bar": bar_key, "close": float(bars["close"].iloc[-1]), "w_now": w_now,
                    "w_target": w_target, "w_new": w_new, "equity": equity, "capital": capital,
                    "halted": self.risk.state.halted}
        self.journal.log("decision", {"strategy": self.strategy.name, "params": self.params}, output=decision)

        # 6. order
        result = "hold"
        delta_qty = self.broker.round_qty(abs(w_new - w_now) * capital / mid)
        if w_new != w_now and delta_qty > 0 and not (dust and w_new == 0):
            side = "buy" if w_new > w_now else "sell"
            if side == "sell":
                delta_qty = min(delta_qty, self.broker.round_qty(qty)) if w_new > 0 else self.broker.round_qty(qty)
            order = Order(self.broker.symbol, side, delta_qty, mid, f"rebalance {w_now:.2f}->{w_new:.2f}", side == "buy")
            self.meta["last_close"] = decision["close"]
            fill = self._execute(order, mid, bar_key)
            pending = fill is None and any(r["bar"] == bar_key for r in self.gate.pending())
            if pending:
                # awaiting approval: do NOT mark the bar decided, so later polls pick up the approval
                self._heartbeat("awaiting_approval", equity=equity)
                return "awaiting_approval"
            result = "filled" if fill else "rejected"

        cash, qty = self.broker.balances()
        self.meta.update(last_bar=bar_key, last_equity=cash + qty * mid, last_close=decision["close"])
        self._save_meta()
        self._heartbeat("ok", equity=equity, result=result, halted=self.risk.state.halted)
        return result

    def run_forever(self) -> None:
        self.journal.log("engine_start", {"live": self.live, "strategy": self.strategy.name, "params": self.params})
        while True:
            self.step()
            time.sleep(self.cfg.engine.poll_seconds)
