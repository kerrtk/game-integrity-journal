"""Live-vs-research monitor. Encodes, in advance, what live result proves a strategy is
broken - and stops it automatically when that happens."""
from __future__ import annotations

import json
import math
from dataclasses import asdict, dataclass, field
from pathlib import Path


@dataclass
class MonitorState:
    bar_returns: list[float] = field(default_factory=list)
    n_trades: int = 0
    slippage: list[float] = field(default_factory=list)   # realised |fill/ref - 1| per order
    peak: float = 1.0
    equity: float = 1.0


class Monitor:
    def __init__(self, kill: dict, path: str | Path, ppy: float):
        self.kill, self.path, self.ppy = kill, Path(path), ppy
        self.state = MonitorState(**json.loads(self.path.read_text())) if self.path.exists() else MonitorState()

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(asdict(self.state)))

    def on_bar(self, ret: float) -> None:
        s = self.state
        s.bar_returns.append(ret)
        s.equity *= 1 + ret
        s.peak = max(s.peak, s.equity)
        self.save()

    def on_fill(self, ref_price: float, fill_price: float, opened: bool) -> None:
        """`opened` = this fill took the position from flat to long, i.e. one round trip,
        the same unit research uses for trades_per_year."""
        self.state.n_trades += int(opened)
        self.state.slippage.append(abs(fill_price / ref_price - 1))
        self.save()

    def breaches(self) -> tuple[list[str], list[str]]:
        """(stop reasons, warnings)."""
        k, s = self.kill, self.state
        stops, warns = [], []
        dd = 1 - s.equity / s.peak
        if dd >= k["max_drawdown"]:
            stops.append(f"live drawdown {dd:.1%} beyond research 99th pct / limit {k['max_drawdown']:.1%}")
        elif dd >= k["warn_drawdown"]:
            warns.append(f"live drawdown {dd:.1%} beyond research 95th pct {k['warn_drawdown']:.1%}")
        n = len(s.bar_returns)
        if n >= 30 and k["per_bar_sd"] > 0:
            cum = sum(s.bar_returns)
            floor = k["per_bar_mean"] * n - k["cone_sigmas"] * k["per_bar_sd"] * math.sqrt(n)
            if cum < floor:
                stops.append(f"live cumulative return {cum:.2%} below {k['cone_sigmas']:g}-sigma research cone {floor:.2%}")
        if n >= 30:
            expected = k["max_trades_per_year"] / 3 * n / self.ppy
            limit = 3 * expected + 4 * math.sqrt(max(expected, 1)) + 2  # Poisson noise allowance
            if s.n_trades > limit:
                stops.append(f"{s.n_trades} entries in {n} bars vs ~{expected:.1f} expected (logic bug?)")
        if len(s.slippage) >= 5 and k["assumed_slippage"] > 0:
            ratio = (sum(s.slippage) / len(s.slippage)) / k["assumed_slippage"]
            if ratio > k["max_slippage_ratio"]:
                stops.append(f"realised slippage {ratio:.1f}x the backtest assumption - costs invalidate the edge")
        return stops, warns
