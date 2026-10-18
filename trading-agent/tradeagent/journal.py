"""Decision log: one JSON line per decision with its inputs, output and result."""
from __future__ import annotations

import json
import time
from pathlib import Path


class Journal:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def log(self, event: str, inputs: dict | None = None, output=None, result=None, **extra) -> dict:
        row = {"ts": time.time(), "event": event, "inputs": inputs or {}, "output": output,
               "result": result, **extra}
        with self.path.open("a") as fh:
            fh.write(json.dumps(row, default=str) + "\n")
            fh.flush()
        return row

    def read(self) -> list[dict]:
        if not self.path.exists():
            return []
        return [json.loads(line) for line in self.path.read_text().splitlines() if line.strip()]
