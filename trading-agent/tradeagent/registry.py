"""Append-only ledger of EVERY variant evaluated, per dataset. The Deflated Sharpe uses it
so that trying 500 parameter sets and reporting the best is penalised, as it should be."""
from __future__ import annotations

import json
import time
from pathlib import Path


class TrialRegistry:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def record(self, dataset: str, strategy: str, params: dict, sharpe_per_period: float, **extra) -> None:
        row = {"ts": time.time(), "dataset": dataset, "strategy": strategy, "params": params,
               "sr": sharpe_per_period, **extra}
        with self.path.open("a") as fh:
            fh.write(json.dumps(row, default=float) + "\n")

    def trials(self, dataset: str) -> list[dict]:
        if not self.path.exists():
            return []
        rows = [json.loads(line) for line in self.path.read_text().splitlines() if line.strip()]
        return [r for r in rows if r["dataset"] == dataset]

    def sharpes(self, dataset: str) -> list[float]:
        return [r["sr"] for r in self.trials(dataset)]
