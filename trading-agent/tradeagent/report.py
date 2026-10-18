"""Markdown research report built ONLY from evaluations actually run. No numbers are typed by hand."""
from __future__ import annotations

from .config import Config
from .strategies import get
from .validation import Evaluation


def _f(x: float, pct: bool = False) -> str:
    if x is None or x != x:
        return "n/a"
    if x == float("inf"):
        return "inf"
    return f"{x:.1%}" if pct else f"{x:.2f}"


def render(evals: list[Evaluation], cfg: Config, data_note: str) -> str:
    v = cfg.venue
    lines = [
        f"# Research report - {v.exchange} {v.symbol} {v.timeframe}",
        "",
        f"Data: {data_note}",
        f"Costs per side: fee {cfg.costs.fee_rate:.2%} + slippage {cfg.costs.slippage_rate:.2%} "
        f"+ half-spread {cfg.costs.half_spread_rate:.2%} = {cfg.costs.per_side:.2%} [ASSUMPTIONS - verify]",
        f"Variants tried on this dataset (all strategies, all runs): **{evals[0].n_trials_dataset if evals else 0}**",
        f"Split: train {evals[0].split['train'][0][:10]} -> {evals[0].split['train'][1][:10]}, "
        f"holdout {evals[0].split['holdout'][0][:10]} -> {evals[0].split['holdout'][1][:10]}" if evals else "",
        "",
        "All metrics below are on the untouched HOLDOUT unless labelled otherwise. "
        "Sharpe is annualised (365-day year, rf=0).",
        "",
        "| Strategy | Edge | Market | Timeframe | Sharpe | Max DD | Trades | Cost Sensitivity (Sharpe @ "
        f"{cfg.validation.cost_stress_multiplier:g}x costs) | DSR | WF OOS Sharpe | Verdict |",
        "|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for e in evals:
        s = get(e.strategy)
        lines.append(
            f"| {e.strategy} | {s.edge} | {v.symbol} spot | {v.timeframe} | {_f(e.holdout['sharpe'])} | "
            f"{_f(e.holdout['max_drawdown'], True)} | {e.holdout['n_trades']} | {_f(e.holdout_stressed['sharpe'])} | "
            f"{_f(e.deflated_sharpe)} | {_f(e.walk_forward['oos_sharpe'])} | **{e.verdict}** |")
    lines.append("")
    for e in evals:
        s = get(e.strategy)
        h, t = e.holdout, e.train
        lines += [
            f"## {e.strategy} - {e.verdict}",
            "",
            f"- **Edge:** {s.edge}",
            f"- **Other side:** {s.counterparty}",
            f"- **Entry:** {s.entry}  **Exit:** {s.exit}  **Stop:** {s.stop}",
            f"- **Holding period:** {s.holding_period}; measured frequency {e.trades_per_year:.1f} trades/yr (train)",
            f"- **Why it should persist:** {s.why_persist}",
            f"- **Selected params (train only):** `{e.params}` from {e.n_variants_strategy} variants; "
            f"{e.neighbor_positive:.0%} of neighbours profitable",
            "",
            "| | Sharpe | CAGR | Max DD | Win rate | Profit factor | Trades | Exposure |",
            "|---|---|---|---|---|---|---|---|",
            f"| Train | {_f(t['sharpe'])} | {_f(t['cagr'], True)} | {_f(t['max_drawdown'], True)} | "
            f"{_f(t['win_rate'], True)} | {_f(t['profit_factor'])} | {t['n_trades']} | {_f(t['exposure'], True)} |",
            f"| Holdout | {_f(h['sharpe'])} | {_f(h['cagr'], True)} | {_f(h['max_drawdown'], True)} | "
            f"{_f(h['win_rate'], True)} | {_f(h['profit_factor'])} | {h['n_trades']} | {_f(h['exposure'], True)} |",
            f"| Holdout @ {cfg.validation.cost_stress_multiplier:g}x costs | {_f(e.holdout_stressed['sharpe'])} | "
            f"{_f(e.holdout_stressed['cagr'], True)} | {_f(e.holdout_stressed['max_drawdown'], True)} | | | | |",
            f"| Buy & hold (holdout) | {_f(e.benchmark_holdout['sharpe'])} | {_f(e.benchmark_holdout['cagr'], True)} | "
            f"{_f(e.benchmark_holdout['max_drawdown'], True)} | | | | |",
            "",
            f"- Deflated Sharpe (vs {e.n_trials_dataset} trials): {_f(e.deflated_sharpe)}; holdout PSR: {_f(e.holdout_psr)}",
            f"- Walk-forward fold Sharpes: {[round(x, 2) for x in e.walk_forward['fold_sharpes']]}",
            f"- Bootstrap max-DD: 95th pct {_f(e.mc_drawdown_95, True)}, 99th pct {_f(e.mc_drawdown_99, True)}",
            f"- Quarter-Kelly cap on weight: {_f(e.kelly_cap)}",
            f"- Regimes (holdout): " + ", ".join(f"{k}: SR {_f(r['sharpe'])} ({r['bars']} bars)"
                                                for k, r in e.regime_breakdown.items()),
            "- **Kill criteria:** " + ", ".join(f"{k}={_f(x) if isinstance(x, float) else x}"
                                               for k, x in e.kill_criteria.items()),
        ]
        if e.reasons:
            lines.append("- **Why not deployed / caveats:** " + "; ".join(e.reasons))
        lines.append("")
    return "\n".join(lines)
