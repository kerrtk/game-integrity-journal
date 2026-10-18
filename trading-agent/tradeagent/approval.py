"""Human approval gate.

Paper mode: orders are auto-approved (no real money moves) but still logged.
Live mode:  every RISK-INCREASING order is written to state/pending/<id>.json and does
            nothing until you run `tradeagent approve-order <id>`. Unapproved requests
            expire. RISK-REDUCING orders (selling down an existing long: signal exits,
            stops, kill switch, halts) are pre-authorised by your signed live deployment,
            because a stop that waits for a human is not a stop.
"""
from __future__ import annotations

import json
import time
import uuid
from pathlib import Path

from .risk import Order


class ApprovalGate:
    def __init__(self, state_dir: str | Path, live: bool, timeout_sec: int):
        self.dir = Path(state_dir) / "pending"
        self.dir.mkdir(parents=True, exist_ok=True)
        self.live, self.timeout = live, timeout_sec

    def request(self, order: Order, bar: str) -> tuple[str, str]:
        """Returns (status, request_id); status is 'approved' | 'pending' | 'expired'."""
        if not self.live or not order.risk_increasing:
            return "approved", "auto"
        # one request per bar+side; re-using it keeps approvals idempotent across polls
        for p in self.dir.glob("*.json"):
            req = json.loads(p.read_text())
            if req["bar"] == bar and req["order"]["side"] == order.side:
                if req.get("approved"):
                    return "approved", req["id"]
                if time.time() - req["created"] > self.timeout:
                    return "expired", req["id"]
                return "pending", req["id"]
        rid = uuid.uuid4().hex[:8]
        (self.dir / f"{rid}.json").write_text(json.dumps(
            {"id": rid, "bar": bar, "created": time.time(), "approved": False, "order": order.__dict__}, indent=2))
        return "pending", rid

    def consume(self, rid: str) -> None:
        if rid != "auto":
            (self.dir / f"{rid}.json").unlink(missing_ok=True)

    def approve(self, rid: str, by: str) -> dict:
        p = self.dir / f"{rid}.json"
        if not p.exists():
            raise FileNotFoundError(f"no pending order {rid}")
        req = json.loads(p.read_text())
        req.update(approved=True, approved_by=by, approved_at=time.time())
        p.write_text(json.dumps(req, indent=2))
        return req

    def pending(self) -> list[dict]:
        return [json.loads(p.read_text()) for p in sorted(self.dir.glob("*.json"))]
