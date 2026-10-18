# tradeagent

A 24/7 crypto trading agent that is built to **refuse to trade** unless a strategy survives
rigorous, chance-adjusted validation, and that runs every order through hard risk limits
in code. Paper trading is the default. Live trading needs four separate human approvals.

> **No profit is promised or implied.** Most systematic strategies fail out of sample.
> This system's job is to find that out cheaply, before real money is involved, and to
> stop itself automatically when live results show a strategy is broken.

---

## 1. System overview

| | |
|---|---|
| **Venue** | Crypto **spot**, Kraken (`BTC/USD`) by default. Any [ccxt](https://docs.ccxt.com) exchange works through config. Crypto is the only liquid market that is genuinely open 24/7. Kraken and Coinbase are both available to US residents. |
| **Why spot, long-only** | No leverage, no liquidation, no funding payments, no borrowing. You give up the short side and get survival in return. |
| **Timeframe** | Daily bars (`1d`). Edges on daily bars need far less infrastructure than intraday ones, and costs don't swamp them as easily. |
| **Approach** | Generate 4 candidate strategies, then send them all through the same tests: a time split, a parameter sweep with every variant logged, a parameter-neighbourhood robustness check, Deflated Sharpe, a holdout test with stressed costs, walk-forward, regime breakdown and bootstrap drawdowns. Only `PAPER_TRADE` verdicts can be deployed. |
| **Regime** | Every bar gets a trend label (above/below SMA200) and a volatility tercile, both computed causally. The agent is forced **flat** whenever realized volatility is above its own historical 95th percentile, because that is when crash and liquidity-trap conditions blow out spreads and slippage. |
| **Current regime / live numbers** | **Not filled in. This build environment has no access to exchange data**, so no real backtest has been run. The rules forbid made-up numbers. Run `research` (step 3 below) to generate them. |

### Fees and venue facts: assumptions you must verify

| Item | Value used | Status |
|---|---|---|
| Taker fee | 0.40% per side | **[ASSUMPTION]** Kraken Pro lowest tier. Check your tier at kraken.com/features/fee-schedule. |
| Slippage | 0.05% per side | **[ASSUMPTION]** Small BTC/USD market orders. The monitor measures the real figure live and stops the strategy if it's more than 2x this. |
| Half-spread | 0.01% | **[ASSUMPTION]** |
| Minimum order size / tick size | Read live from the exchange through `load_markets()` | Taken from the exchange, not assumed |
| API rate limits | Handled by ccxt `enableRateLimit` | Taken from the exchange |
| Funding rates / open interest | **Not used.** These only exist for perpetual futures, and this system trades spot. | A possible regime input for later. Not wired in, and no data is invented for it. |

---

## 2. Candidate strategies & comparison table

| Strategy | Edge (one sentence) | Who's on the other side | Holding |
|---|---|---|---|
| `trend_ma` | Crypto trends persist because information spreads slowly and money chases performance. | Early profit-takers, mean-reversion sellers | Weeks to months |
| `donchian` | Breakouts to new N-bar highs tend to continue more than they reverse. | Range traders selling at resistance | Weeks |
| `tsmom` | Assets with a positive trailing return keep beating cash. | Contrarians, value-anchored sellers | Weeks to months |
| `rsi_dip` | Oversold dips inside an uptrend snap back, which pays whoever provides liquidity. | Forced or panicked sellers | Days |
| `buy_hold` | Benchmark only. Every strategy must beat it on a risk-adjusted basis. | | |

Full rules for each strategy (entry, exit, stop, and why the edge should persist) are in
`tradeagent/strategies.py`. Signals are kept separate from execution: a strategy only returns
long or flat, and it can't size or place an order.

**Results table.** `research` generates it from real runs, and none of it is typed by hand:

| Strategy | Edge | Market | Timeframe | Sharpe | Max DD | Trades | Cost Sensitivity | Verdict |
|---|---|---|---|---|---|---|---|---|
| trend_ma | see above | BTC/USD spot | 1d | *run research* | *run research* | *run research* | *Sharpe at 2x costs* | *pending* |
| donchian | | | | | | | | *pending* |
| tsmom | | | | | | | | *pending* |
| rsi_dip | | | | | | | | *pending* |

What was tested here: on **synthetic zero-drift random walks** (three seeds), the full test
pipeline deploys **nothing**, which is correct because noise has no edge. On a synthetic series
whose training period fell 91%, it rejected every trend strategy and sized each one at zero.
That only shows the pipeline is wired correctly. It says nothing about real performance.

### Verdict rules (in `validation.py`)
- **REJECT** if any of these fail: holdout Sharpe > 0; Sharpe > 0 at 2x costs; ≥70% of neighbouring parameter sets profitable; walk-forward out-of-sample Sharpe > 0 with at least half the folds positive; in-sample Kelly > 0.
- **WATCHLIST** if it passes all of those but misses one of these: Deflated Sharpe ≥ 0.95 (counted against **every** variant ever tried on the dataset); ≥30 holdout trades; beats buy and hold on Sharpe, or keeps ≤60% of its drawdown at ≥0.8x its Sharpe.
- **PAPER_TRADE** only if it passes everything. Nothing goes from a backtest straight to live.

For each deployed strategy, the report and its `deployments/<name>.json` manifest record the
rules, train and holdout metrics (Sharpe, CAGR, max DD, win rate, profit factor, trades,
exposure), cost stress, DSR, walk-forward folds, regime breakdown, bootstrap DD (95th and 99th percentile),
the Kelly cap and the **kill criteria**.

---

## 3. Execution, sizing & risk (all enforced in code)

```
strategy signal (0/1) ─▶ stay-out filter ─▶ vol-target sizing ∧ ¼-Kelly cap ─▶ rebalance band
      ─▶ RiskManager.check_order ─▶ ApprovalGate ─▶ Broker ─▶ decision log ─▶ Monitor
```
Precedence: **kill switch > sticky halt > risk limits > approval > strategy.** No model or
strategy output can override a limit.

| Control | Default | Behaviour |
|---|---|---|
| Sizing | 20% annual vol target, capped at ¼ Kelly | The config loader refuses Kelly fractions above 0.5. Weight is never above 1 (no leverage). |
| Max position | $1,000 notional (paper). **$100 live cap** to start. | The agent sizes itself inside the cap. The risk check is a backstop. |
| Max daily loss | 3% | Halts until the next UTC day |
| Max drawdown | 15% from peak | **Sticky halt**, then flatten. A human has to run `reset --confirm`. |
| Stale data | Newest closed bar ≤ 2 bars old | No decision is made. The error counts toward the circuit breaker. |
| API errors | 5 in 15 minutes | Sticky halt, then flatten |
| Orders per day | 6 entries | Exits are always allowed |
| Price sanity | Entry rejected if the quote is more than 5% from the last close | Catches bad ticks and fat fingers |
| Kill switch | `tradeagent kill` | Flattens the whole position and halts until reset |
| Unclosed bars | Always dropped | Prevents the most common live look-ahead bug |
| Withdrawals | **No method for them exists in the codebase** | Use trade-only API keys with withdrawals disabled and an IP allow-list |

### Your approval gates
1. `approve-deployment <manifest> --stage paper` works only on a `PAPER_TRADE` verdict.
2. `approve-deployment <manifest> --stage live` needs paper approval first, plus at least 30 paper-traded bars.
3. `live` needs config `mode = "live"` **and** the env var `TRADEAGENT_LIVE=I_UNDERSTAND_THIS_USES_REAL_MONEY`.
4. In live mode, **every risk-increasing order** waits in `state/pending/` until you run `approve-order <id>`. Requests expire after 1 hour. Risk-reducing exits (signal exits, stops, halts, kill switch) are pre-authorised by your signed live deployment, because a stop that waits for a human is not a stop.

### Kill criteria (checked automatically every bar; any breach is a sticky halt, then flatten)
- Live drawdown beyond the bootstrap 99th percentile, or beyond the 15% limit, whichever is lower. A warning is raised at the 95th percentile.
- Cumulative live return falls below the 3-sigma cone of the research return distribution (checked after 30 bars).
- More entries than ~3x the research rate, after allowing for Poisson noise. That pattern usually means a logic bug.
- Realised slippage above 2x the backtest assumption. If that happens, the costs have wiped out the edge.

### Monitoring
- `state/decisions.jsonl` logs every decision with its inputs, output and result.
- `state/heartbeat.json` is updated on every poll.
- `tradeagent healthcheck` exits non-zero when the agent is stale, halted, killed or erroring. Point cron or an uptime monitor at it (see `deploy/`).
- `tradeagent status` and `tradeagent pending` show the current state.

---

## 4. AgenKit build plan

Phase documents with approval checkboxes are in [`docs/AGENKIT_PHASES.md`](docs/AGENKIT_PHASES.md). The
bear case is in [`docs/BEAR_CASE.md`](docs/BEAR_CASE.md). I don't have access to the
agenkit.xyz tool itself, so the phases (spec → architecture → plan → test-first build →
review → ship) are mirrored as documents and gates in this repo.

### Repo structure
```
trading-agent/
  config/default.toml      all limits & cost assumptions (validated on load)
  tradeagent/
    data.py                fetch (ccxt), CSV I/O, quality checks, drop unclosed bars
    indicators.py regime.py
    strategies.py          4 candidates + benchmark (signals only)
    sizing.py              vol targeting + fractional Kelly cap
    backtest.py            next-bar fills, costs, weight drift, shared rebalance rule
    metrics.py             Sharpe, DD, PF, PSR, Deflated Sharpe, block bootstrap
    registry.py            append-only log of every variant tried
    validation.py          the test pipeline + verdicts + kill criteria
    report.py manifest.py  report + approved deployment contracts
    risk.py approval.py    hard limits, halts, human approval gate
    broker.py              Paper / ccxt live / replay (no withdraw method)
    engine.py monitor.py   24/7 loop, live-vs-research kill monitor
    journal.py cli.py
  tests/                   53 tests
  deploy/                  systemd unit + healthcheck cron
```

### Test suite (`python3 -m pytest -q` → 53 passed)
- **No look-ahead.** Every strategy's sized target weights are identical whether or not future bars exist, and identical when the future is shocked 3x.
- **No edge in noise.** Three random-walk seeds run through the full pipeline, and none produce `PAPER_TRADE`.
- **Engine ↔ backtest parity.** The real engine, replayed bar by bar, reproduces the research backtest (correlation > 0.97, final equity within 5%).
- **Execution timing.** Hand-computed next-bar fills, costs, weight drift, and a check that a signal on the last bar can't capture that bar's move.
- **Risk.** Caps, no shorting, minimum sizes, price deviation, sticky versus daily halts, halts that persist across restarts, the API breaker, the order rate limit, stale data.
- **Gates.** Live entries wait for approval and expire. The kill switch flattens the position and halts. REJECT verdicts and unapproved manifests are refused.
- **Config.** Full Kelly, zero costs, leverage and unknown keys are all refused.

### First module to build (done)
The validation stack (`backtest` → `metrics` → `validation`), with no-look-ahead tests written
first. Everything downstream depends on the backtest being honest.

### Commands: from zero to paper trading
```bash
cd trading-agent
pip install -r requirements.txt
python3 -m pytest -q                                   # 53 tests must pass

python3 -m tradeagent fetch --since 2017-01-01         # real closed daily bars via ccxt
python3 -m tradeagent check-data data/kraken_BTC-USD_1d.csv
python3 -m tradeagent research --data data/kraken_BTC-USD_1d.csv   # report + manifests

# GATE: read reports/research_*.md. Only PAPER_TRADE manifests can be approved.
python3 -m tradeagent approve-deployment deployments/<strategy>.json --stage paper --by "<you>"

python3 -m tradeagent paper --manifest deployments/<strategy>.json --replay data/kraken_BTC-USD_1d.csv  # offline dry run
python3 -m tradeagent paper --manifest deployments/<strategy>.json   # START PAPER TRADING (24/7 loop)
```
If no strategy earns `PAPER_TRADE` on real data, **that is the system working**. Don't loosen
the thresholds to get one through. Every extra variant you try is counted in the registry
and raises the bar.

---

## 5. HOW COULD THIS SYSTEM FAIL?

Ordered by how likely I think each one is:

1. **The edge has been arbitraged away or is mostly beta.** Long-only trend following on BTC
   has done well historically largely *because BTC went up*. The buy-and-hold comparison and
   the regime breakdown are there to expose this, but in a long bear market every
   strategy here will mostly sit in cash and earn nothing. That is the intended behaviour.
2. **Costs are higher than assumed.** At a 0.40% taker fee, `rsi_dip` (the most frequent
   trader) is the most fragile. Mitigations: the 2x cost stress test, the 10% rebalance band,
   and the live slippage kill criterion. Higher-volume fee tiers or maker (limit) orders would
   help, but those aren't built yet.
3. **Overfitting despite everything.** Deflated Sharpe assumes trials are independent, and the
   sweep variants are highly correlated, so it is conservative in some ways and can be wrong in others.
   One holdout period is still one market history. Treat the paper-trading period as the real
   out-of-sample test.
4. **Too little evidence.** Daily trend systems trade around 5 to 15 times a year. Thirty holdout trades
   may take years of data, so expect `WATCHLIST` verdicts. Live Sharpe can't be judged
   quickly. That's why the kill criteria rely on drawdown, the return cone, slippage and trade rate.
5. **Single point of failure: the process or host dies while long.** No stop then exists on the exchange.
   Mitigations: systemd restarts, a cron healthcheck alert, and persisted state. **Most important next
   build: place an exchange-native protective stop order after every entry.**
6. **Exchange or data feed failure.** Stale or bad data means no decisions are made, and repeated errors trigger a sticky halt and flatten.
   But if the exchange itself is down, the flatten order can't go through either. Spreading risk across
   exchanges isn't built.
7. **Gap risk.** Stops are checked on daily closes and filled at the next open. A crash between
   checks fills at the gap price. The vol-based stay-out filter and the vol-target sizing reduce
   exposure going into turbulent periods, but they can't remove it.
8. **Survivorship bias.** Only BTC/USD is researched, so there is no basket of delisted
   coins to bias the results. Adding altcoins later would bring this risk back.
9. **Operator error.** Over-approving pending orders, resetting halts without investigating,
   or loosening config limits. Every action is logged, and resets require `--confirm`.
10. **Security.** Leaked API keys. Use trade-only keys with no withdrawal permission and an IP
    allow-list. Keys are read only from environment variables and never logged.

**Survival over a good-looking backtest:** every default in this repo makes the agent trade
less, smaller, or not at all.
