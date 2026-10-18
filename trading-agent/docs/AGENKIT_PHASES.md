# Build phases and approval gates

Each phase ends at a gate. Nothing moves to the next phase until you tick its box.

## Phase 1: Spec
- Market: crypto spot, long-only, no leverage. Default venue is Kraken BTC/USD on daily bars, and any ccxt venue can be set in config.
- Goal: trade only strategies that pass the validation pipeline, with survival placed ahead of returns.
- Limits: 3% daily loss, 15% drawdown, $1k paper position cap, $100 live capital cap, ¼ Kelly, 20% vol target.
- Stays out of: extreme-volatility regimes (realized vol above its expanding 95th percentile), stale or bad data, any condition that triggers a halt.
- Out of scope for v0.1: shorting, perpetual futures and funding-rate signals, multiple assets, intraday trading, maker orders, exchange-native stops.
- [ ] **GATE 1: spec approved**

## Phase 2: Architecture
- Strategy logic stays separate from sizing, risk, approval and the broker. A strategy only returns long or flat.
- Research and live use the same code path to compute target weights (`validation.target_weights`) and the same rebalance rule (`backtest.rebalance_decision`).
- State (risk, account, approvals, monitor) is persisted to `state/` with atomic writes for risk, so a restart never forgets a halt.
- [ ] **GATE 2: architecture approved**

## Phase 3: Plan
1. Validation stack first: data checks, backtest, metrics, validation, plus tests for no look-ahead and no edge in noise. **Done.**
2. Risk, approval, journal and monitor, each with unit tests. **Done.**
3. Engine with paper broker and replay, plus parity and kill-switch tests. **Done.**
4. Ops: healthcheck, systemd unit, cron alert. **Done.**
5. Next: exchange-native protective stops, maker-order execution, a notification hook for pending approvals, and multi-asset research with survivorship-aware data.
- [ ] **GATE 3: plan approved**

## Phase 4: Test-first build
- `python3 -m pytest -q` passes all 53 tests.
- [ ] **GATE 4: build reviewed**

## Phase 5: Review (bear case)
- See `BEAR_CASE.md` and section 5 of the README.
- Run `research` on real data, then read the report. Every strategy must be judged on its holdout result, its stressed-cost result and its Deflated Sharpe.
- [ ] **GATE 5: research report reviewed; manifests approved for paper**

## Phase 6: Ship, in stages
1. Paper trading for at least 30 bars (about a month on daily bars). Longer is better.
2. Compare the paper results with the research expectations: slippage, trade rate, drawdown.
3. Approve the manifest for live, set `mode = "live"`, set the env phrase, and keep `capital_cap = 100`.
4. Raise the cap only after an extended live period stays inside the research cone. Every raise is your own config change.
- [ ] **GATE 6: live approved, at the smallest size**
