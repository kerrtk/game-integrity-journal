"""Deployment manifests: the frozen, human-approved contract between research and the engine.
The engine trades ONLY the strategy and parameters in an approved manifest."""
from __future__ import annotations

import json
import time
from pathlib import Path

from .validation import PAPER_TRADE, Evaluation

MIN_PAPER_BARS = 30


class ManifestError(RuntimeError):
    pass


def write(ev: Evaluation, directory: str | Path) -> Path:
    path = Path(directory) / f"{ev.strategy}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = json.loads(ev.to_json())
    doc["approval"] = {"paper": None, "live": None}
    path.write_text(json.dumps(doc, indent=2))
    return path


def load(path: str | Path) -> dict:
    return json.loads(Path(path).read_text())


def approve(path: str | Path, stage: str, by: str, paper_bars: int = 0) -> dict:
    doc = load(path)
    if doc["verdict"] != PAPER_TRADE:
        raise ManifestError(f"verdict is {doc['verdict']}: only PAPER_TRADE strategies can be deployed")
    if stage == "live":
        if not doc["approval"].get("paper"):
            raise ManifestError("approve for paper first")
        if paper_bars < MIN_PAPER_BARS:
            raise ManifestError(f"only {paper_bars} paper-traded bars; need >= {MIN_PAPER_BARS}")
    elif stage != "paper":
        raise ManifestError("stage must be 'paper' or 'live'")
    doc["approval"][stage] = {"by": by, "at": time.time()}
    Path(path).write_text(json.dumps(doc, indent=2))
    return doc


def require_approved(doc: dict, stage: str) -> None:
    if doc.get("verdict") != PAPER_TRADE:
        raise ManifestError(f"manifest verdict {doc.get('verdict')} is not deployable")
    if not (doc.get("approval") or {}).get(stage):
        raise ManifestError(f"manifest not approved for {stage}: run `tradeagent approve-deployment`")
