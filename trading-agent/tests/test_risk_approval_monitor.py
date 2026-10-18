import time

import pandas as pd
import pytest

from tradeagent.approval import ApprovalGate
from tradeagent.config import Risk
from tradeagent.monitor import Monitor
from tradeagent.risk import Order, RiskManager

NOW = pd.Timestamp("2024-01-01T12:00", tz="UTC")


def rm(tmp_path, **kw):
    return RiskManager(Risk(**kw), tmp_path / "risk.json", position_cap=1000)


def buy(qty, px=100.0):
    return Order("BTC/USD", "buy", qty, px, "t", True)


def sell(qty, px=100.0):
    return Order("BTC/USD", "sell", qty, px, "t", False)


def test_position_cap_and_no_leverage(tmp_path):
    r = rm(tmp_path)
    assert r.check_order(buy(5), 0, 10_000, 100) == []
    assert any("cap" in v for v in r.check_order(buy(11), 0, 10_000, 100))
    assert any("leverage" in v for v in r.check_order(buy(5), 0, 300, 100))


def test_no_shorting_and_minimums(tmp_path):
    r = rm(tmp_path)
    assert any("shorting" in v for v in r.check_order(sell(2), 1, 10_000, 100))
    assert any("minimum" in v for v in r.check_order(buy(0.01), 0, 10_000, 100, min_notional=5))


def test_price_deviation_blocks_entries_not_exits(tmp_path):
    r = rm(tmp_path)
    assert any("deviates" in v for v in r.check_order(buy(1, 120), 0, 10_000, 100))
    assert r.check_order(sell(1, 50), 1, 10_000, 100) == []


def test_drawdown_halt_is_sticky_and_allows_only_exits(tmp_path):
    r = rm(tmp_path, max_drawdown_pct=0.15, max_daily_loss_pct=0.99 * 0.15)
    r.update_equity(1000, NOW)
    r.update_equity(1000, NOW + pd.Timedelta(days=1))
    assert r.update_equity(840, NOW + pd.Timedelta(days=2))
    assert r.state.halted and r.state.halt_kind == "sticky"
    r.update_equity(900, NOW + pd.Timedelta(days=5))
    assert r.state.halted  # new day does not clear a sticky halt
    assert any("halted" in v for v in r.check_order(buy(1), 0, 900, 100))
    assert r.check_order(sell(1), 1, 900, 100) == []
    # persisted across restarts
    assert rm(tmp_path).state.halted
    r.reset()
    assert not r.state.halted


def test_daily_loss_halt_clears_next_day(tmp_path):
    r = rm(tmp_path, max_daily_loss_pct=0.03, max_drawdown_pct=0.5)
    r.update_equity(1000, NOW)
    r.update_equity(960, NOW + pd.Timedelta(hours=2))
    assert r.state.halted and r.state.halt_kind == "daily"
    r.update_equity(960, NOW + pd.Timedelta(days=1))
    assert not r.state.halted


def test_api_error_breaker(tmp_path):
    r = rm(tmp_path, max_api_errors=3, api_error_window_sec=60)
    t = time.time()
    assert not r.record_api_error(t)
    assert not r.record_api_error(t + 100)  # first error aged out
    assert not r.record_api_error(t + 101)
    assert r.record_api_error(t + 102)
    assert r.state.halted


def test_order_rate_limit(tmp_path):
    r = rm(tmp_path, max_orders_per_day=2)
    r.update_equity(10_000, NOW)
    r.note_order()
    r.note_order()
    assert any("per day" in v for v in r.check_order(buy(1), 0, 10_000, 100))


def test_stale(tmp_path):
    r = rm(tmp_path, stale_data_bars=2)
    bar = pd.Timestamp("2024-01-01", tz="UTC")
    assert not r.is_stale(bar, 86400, bar + pd.Timedelta(days=2))
    assert r.is_stale(bar, 86400, bar + pd.Timedelta(days=3, seconds=1))


def test_approval_gate(tmp_path):
    g = ApprovalGate(tmp_path, live=True, timeout_sec=3600)
    assert g.request(sell(1), "b1") == ("approved", "auto")
    status, rid = g.request(buy(1), "b1")
    assert status == "pending"
    assert g.request(buy(1), "b1") == ("pending", rid)  # idempotent across polls
    g.approve(rid, "tk")
    assert g.request(buy(1), "b1") == ("approved", rid)
    paper = ApprovalGate(tmp_path / "p", live=False, timeout_sec=1)
    assert paper.request(buy(1), "b1")[0] == "approved"


def test_approval_expires(tmp_path):
    g = ApprovalGate(tmp_path, live=True, timeout_sec=0)
    g.request(buy(1), "b1")
    time.sleep(0.01)
    assert g.request(buy(1), "b1")[0] == "expired"


KILL = {"max_drawdown": 0.2, "warn_drawdown": 0.1, "per_bar_mean": 0.001, "per_bar_sd": 0.01,
        "cone_sigmas": 3.0, "max_trades_per_year": 20, "max_slippage_ratio": 2.0, "assumed_slippage": 0.001}


def test_monitor_drawdown_and_cone(tmp_path):
    m = Monitor(KILL, tmp_path / "m.json", 365)
    for _ in range(40):
        m.on_bar(-0.01)
    stops, _ = m.breaches()
    assert any("drawdown" in s for s in stops) and any("cone" in s for s in stops)


def test_monitor_slippage_and_overtrading(tmp_path):
    m = Monitor(KILL, tmp_path / "m.json", 365)
    for _ in range(30):
        m.on_bar(0.0)
    for _ in range(6):
        m.on_fill(100, 100.5, opened=True)  # 0.5% vs 0.1% assumed
    stops, _ = m.breaches()
    assert any("slippage" in s for s in stops)
    assert not any("entries" in s for s in stops)  # 6 entries in 30 bars is within noise
    for _ in range(20):
        m.on_fill(100, 100, opened=True)
    assert any("entries" in s for s in m.breaches()[0])
