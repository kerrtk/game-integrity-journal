# Bear case: trying to break each strategy

For each attack: what it is, how the system defends against it, and what result would show the strategy is broken.

| Attack | Defence in code | Result that proves it's broken (automatic stop) |
|---|---|---|
| **Overfitting** | Train-only sweep, neighbour robustness (≥70% of neighbours profitable), Deflated Sharpe across every variant in the registry, walk-forward re-optimisation | Live return falls below the 3σ research cone |
| **Look-ahead bias** | Signals use the bar close and fill at the next open. Unclosed bars are dropped. Tests check truncation invariance and a future shock. Regime percentiles use expanding windows. | Engine and backtest disagree (the parity test fails) |
| **Survivorship bias** | Single asset (BTC). The data quality check warns about gaps and delisting-like holes. | — |
| **Cost sensitivity** | 2x cost stress must keep Sharpe > 0. 10% rebalance band. Zero-cost configs are refused. | Realised slippage > 2x the assumption |
| **Regime dependence** | Per-regime Sharpe in the report. Buy-and-hold comparison. Flat during extreme volatility. | Drawdown beyond the bootstrap 99th percentile |
| **Crowded trades** | Daily timeframe, small size. The rules are deliberately well known, so the bet is on persistence, not secrecy. | Return cone breach |
| **Liquidity traps** | BTC/USD only. Flat in the extreme-volatility regime. Price-deviation check on entries. | Slippage kill |
| **Infrastructure single point of failure** | systemd restart, healthcheck alert, persisted state, API-error breaker with flatten | Healthcheck fails and an alert goes to the operator |
| **Logic bugs** | 53 tests and the engine/backtest parity check | Entries well above the research rate (Poisson-adjusted) |

## Per-strategy weakest point
- **trend_ma / donchian / tsmom:** these may mostly be capturing BTC beta. If they don't beat buy-and-hold on Sharpe or drawdown in the holdout, they are WATCHLIST at best. They also lose money steadily in choppy, sideways markets.
- **rsi_dip:** the weakest economic story and the most trades, so it is the most exposed to the 0.40% taker fee. Expect it to fail the 2x cost stress.

## Questions to ask yourself before going live
- Would this survive costs 2x higher? The report shows it directly.
- Has the edge already been arbitraged away? The holdout is the most recent data. If the edge is decaying, that is where it shows.
- What happens if the data feed fails? No decision is made. After 5 errors there is a sticky halt and a flatten attempt. If the exchange is down, the flatten fails too. This is a known gap.
- What happens if the exchange fails while you hold a position? You are exposed until it comes back. The next module to build is an exchange-native stop.
