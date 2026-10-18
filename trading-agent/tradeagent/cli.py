"""Command line: python -m tradeagent <command> ...  (see README for the full workflow)."""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import pandas as pd

from . import data as datamod
from . import manifest as mf
from .config import load_config

LIVE_ENV = "TRADEAGENT_LIVE"
LIVE_PHRASE = "I_UNDERSTAND_THIS_USES_REAL_MONEY"


def _cfg(args):
    return load_config(args.config)


def cmd_fetch(args):
    cfg = _cfg(args)
    df = datamod.fetch_ohlcv(cfg.venue.exchange, cfg.venue.symbol, cfg.venue.timeframe, since=args.since)
    out = Path(args.out or f"data/{cfg.venue.exchange}_{cfg.venue.symbol.replace('/', '-')}_{cfg.venue.timeframe}.csv")
    out.parent.mkdir(parents=True, exist_ok=True)
    datamod.save_csv(df, out)
    print(f"saved {len(df)} closed bars {df.index[0]} -> {df.index[-1]} to {out}")


def _load_checked(path, tf):
    df = datamod.load_csv(path)
    rep = datamod.check_quality(df, tf)
    for w in rep.warnings:
        print(f"WARNING: {w}", file=sys.stderr)
    if not rep.ok:
        sys.exit(f"data rejected: {rep.errors}")
    return df


def cmd_check_data(args):
    cfg = _cfg(args)
    df = _load_checked(args.data, cfg.venue.timeframe)
    print(f"OK: {len(df)} bars {df.index[0]} -> {df.index[-1]}, hash {datamod.dataset_hash(df)}")


def cmd_research(args):
    from .registry import TrialRegistry
    from .report import render
    from .strategies import CANDIDATES, get
    from .validation import evaluate

    cfg = _cfg(args)
    df = _load_checked(args.data, cfg.venue.timeframe)
    reg = TrialRegistry(args.registry)
    chosen = [get(n) for n in args.strategies.split(",")] if args.strategies else CANDIDATES
    evals = []
    for s in chosen:
        print(f"evaluating {s.name} ({len(s.param_sets())} variants)...", flush=True)
        evals.append(evaluate(df, s, cfg, reg))
    # every manifest gets the final trial count so DSR reflects ALL candidates
    final_n = len(reg.sharpes(evals[0].dataset))
    if any(e.n_trials_dataset != final_n for e in evals):
        print(f"re-scoring Deflated Sharpe against all {final_n} trials...", flush=True)
        evals = [evaluate(df, s, cfg, reg) for s in chosen]
    note = f"{args.data} ({len(df)} bars, {df.index[0]:%Y-%m-%d} -> {df.index[-1]:%Y-%m-%d}, hash {evals[0].dataset})"
    report = render(evals, cfg, note)
    out = Path(args.report or f"reports/research_{evals[0].dataset}.md")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(report)
    for e in evals:
        if not get(e.strategy).benchmark:
            mf.write(e, args.deployments)
    print(report)
    print(f"\nreport: {out}\nmanifests: {args.deployments}/ (none are approved; see `approve-deployment`)")


def cmd_approve_deployment(args):
    bars = 0
    if args.stage == "live":
        from .journal import Journal

        cfg = _cfg(args)
        bars = len({r["output"]["bar"] for r in Journal(cfg.engine.log_file).read() if r["event"] == "decision"})
    doc = mf.approve(args.manifest, args.stage, args.by, paper_bars=bars)
    print(f"{doc['strategy']} approved for {args.stage} by {args.by}")


def _engine(args, live: bool, broker=None):
    from .engine import Engine

    cfg = _cfg(args)
    doc = mf.load(args.manifest)
    mf.require_approved(doc, "live" if live else "paper")
    if broker is None:
        from .broker import CcxtBroker, CcxtFeed, PaperBroker

        if live:
            broker = CcxtBroker(cfg.venue.exchange, cfg.venue.symbol)
        else:
            broker = PaperBroker(cfg.venue.symbol, CcxtFeed(cfg.venue.exchange, cfg.venue.symbol),
                                 Path(cfg.engine.state_dir) / "paper_account.json",
                                 cfg.costs.fee_rate, cfg.costs.slippage_rate, args.cash)
    return Engine(cfg, doc, broker, live=live)


def cmd_paper(args):
    if args.replay:
        return _replay(args)
    eng = _engine(args, live=False)
    if args.once:
        print(eng.step())
    else:
        eng.run_forever()


def _replay(args):
    """Offline paper simulation over a CSV: drives the REAL engine bar by bar."""
    from .broker import PaperBroker, ReplayFeed
    from .data import timeframe_seconds
    from .engine import HISTORY_BARS

    cfg = _cfg(args)
    df = _load_checked(args.replay, cfg.venue.timeframe)
    feed = ReplayFeed(df)
    broker = PaperBroker(cfg.venue.symbol, feed, Path(cfg.engine.state_dir) / "paper_account.json",
                         cfg.costs.fee_rate, cfg.costs.slippage_rate, args.cash)
    eng = _engine(args, live=False, broker=broker)
    step = pd.Timedelta(seconds=timeframe_seconds(cfg.venue.timeframe))
    for ts in df.index[HISTORY_BARS:-1]:
        feed.now = ts
        eng.step(now=ts + step + pd.Timedelta(seconds=1))
    cash, qty = broker.balances()
    print(f"replay done: cash {cash:.2f}, qty {qty:.6f}, halted={eng.risk.state.halted} {eng.risk.state.halt_reason}")


def cmd_live(args):
    if os.environ.get(LIVE_ENV) != LIVE_PHRASE:
        sys.exit(f"refusing live trading: set {LIVE_ENV}={LIVE_PHRASE} to confirm")
    cfg = _cfg(args)
    if cfg.mode != "live":
        sys.exit("refusing live trading: config mode is not 'live'")
    eng = _engine(args, live=True)
    print(f"LIVE: capital cap {cfg.live.capital_cap} {cfg.venue.quote_currency}; entries need approval")
    if args.once:
        print(eng.step())
    else:
        eng.run_forever()


def cmd_kill(args):
    cfg = _cfg(args)
    p = Path(cfg.engine.state_dir) / "KILL"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(args.reason or "manual")
    print(f"KILL switch engaged ({p}). The running engine will flatten and halt on its next poll.")
    if args.now:
        if not args.manifest:
            sys.exit("--now needs --manifest")
        eng = _engine(args, live=args.live)
        print(eng.step())


def cmd_reset(args):
    from .risk import RiskManager

    if not args.confirm:
        sys.exit("reset clears a halt; re-run with --confirm after you have investigated the cause")
    cfg = _cfg(args)
    sd = Path(cfg.engine.state_dir)
    (sd / "KILL").unlink(missing_ok=True)
    RiskManager(cfg.risk, sd / "risk.json", cfg.risk.max_position_notional).reset()
    print("halt cleared, kill file removed, drawdown peak re-based")


def cmd_status(args):
    cfg = _cfg(args)
    sd = Path(cfg.engine.state_dir)
    for name in ("heartbeat.json", "risk.json", "paper_account.json", "engine.json"):
        p = sd / name
        print(f"--- {name}\n{p.read_text() if p.exists() else '(none)'}")
    print(f"--- KILL file: {'PRESENT' if (sd / 'KILL').exists() else 'absent'}")


def cmd_healthcheck(args):
    """Exit 1 if the engine heartbeat is older than --max-age seconds or the agent is halted.
    Point an external monitor (cron, systemd timer, uptime service) at this."""
    import time

    cfg = _cfg(args)
    p = Path(cfg.engine.state_dir) / "heartbeat.json"
    if not p.exists():
        sys.exit("UNHEALTHY: no heartbeat")
    hb = json.loads(p.read_text())
    age = time.time() - hb["ts"]
    if age > args.max_age:
        sys.exit(f"UNHEALTHY: heartbeat {age:.0f}s old")
    if hb.get("halted") or hb.get("status") in ("killed", "error"):
        sys.exit(f"UNHEALTHY: status={hb.get('status')} halted={hb.get('halted')}")
    print(f"OK: {hb['status']} {age:.0f}s ago")


def cmd_pending(args):
    from .approval import ApprovalGate

    cfg = _cfg(args)
    for req in ApprovalGate(cfg.engine.state_dir, True, cfg.live.approval_timeout_sec).pending():
        print(json.dumps(req, indent=2))


def cmd_approve_order(args):
    from .approval import ApprovalGate

    cfg = _cfg(args)
    req = ApprovalGate(cfg.engine.state_dir, True, cfg.live.approval_timeout_sec).approve(args.id, args.by)
    print(f"approved {req['id']}: {req['order']['side']} {req['order']['qty']} - executes on the next poll")


def main(argv=None):
    p = argparse.ArgumentParser(prog="tradeagent")
    p.add_argument("--config", default="config/default.toml")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("fetch", help="download closed OHLCV bars via ccxt")
    s.add_argument("--since", default="2017-01-01")
    s.add_argument("--out")
    s.set_defaults(fn=cmd_fetch)

    s = sub.add_parser("check-data")
    s.add_argument("data")
    s.set_defaults(fn=cmd_check_data)

    s = sub.add_parser("research", help="evaluate every candidate and write the report + manifests")
    s.add_argument("--data", required=True)
    s.add_argument("--strategies", help="comma list; default all")
    s.add_argument("--registry", default="reports/trials.jsonl")
    s.add_argument("--deployments", default="deployments")
    s.add_argument("--report")
    s.set_defaults(fn=cmd_research)

    s = sub.add_parser("approve-deployment")
    s.add_argument("manifest")
    s.add_argument("--stage", choices=["paper", "live"], required=True)
    s.add_argument("--by", required=True)
    s.set_defaults(fn=cmd_approve_deployment)

    for name, fn in (("paper", cmd_paper), ("live", cmd_live)):
        s = sub.add_parser(name)
        s.add_argument("--manifest", required=True)
        s.add_argument("--once", action="store_true")
        s.add_argument("--cash", type=float, default=10_000.0, help="paper starting cash")
        if name == "paper":
            s.add_argument("--replay", help="CSV to replay offline through the real engine")
        s.set_defaults(fn=fn)

    s = sub.add_parser("kill", help="engage the kill switch: flatten everything and halt")
    s.add_argument("--reason")
    s.add_argument("--now", action="store_true", help="also run one engine step immediately")
    s.add_argument("--manifest")
    s.add_argument("--live", action="store_true")
    s.add_argument("--cash", type=float, default=10_000.0)
    s.set_defaults(fn=cmd_kill)

    s = sub.add_parser("reset")
    s.add_argument("--confirm", action="store_true")
    s.set_defaults(fn=cmd_reset)

    sub.add_parser("status").set_defaults(fn=cmd_status)
    sub.add_parser("pending").set_defaults(fn=cmd_pending)
    s = sub.add_parser("healthcheck")
    s.add_argument("--max-age", type=int, default=300)
    s.set_defaults(fn=cmd_healthcheck)
    s = sub.add_parser("approve-order")
    s.add_argument("id")
    s.add_argument("--by", required=True)
    s.set_defaults(fn=cmd_approve_order)

    args = p.parse_args(argv)
    args.fn(args)


if __name__ == "__main__":
    main()
