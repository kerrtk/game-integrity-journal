"""Broker adapters. Deliberately NO withdraw/transfer method exists anywhere in this
codebase: the agent can trade, never move money off the exchange. Use exchange API keys
with trading permission only, withdrawals disabled, and IP allow-listing."""
from __future__ import annotations

import json
import os
import time
import uuid
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass
from pathlib import Path

import pandas as pd

from .data import rows_to_frame


class BrokerError(RuntimeError):
    pass


@dataclass
class Fill:
    id: str
    side: str
    qty: float
    price: float
    fee: float
    ts: float


@dataclass
class Limits:
    min_qty: float = 0.0
    min_notional: float = 0.0
    qty_step: float = 0.0


class Broker(ABC):
    symbol: str

    @abstractmethod
    def fetch_ohlcv(self, tf: str, limit: int) -> pd.DataFrame: ...

    @abstractmethod
    def quote(self) -> tuple[float, float]:
        """(bid, ask)"""

    @abstractmethod
    def balances(self) -> tuple[float, float]:
        """(quote-currency cash, base-asset quantity)"""

    @abstractmethod
    def market_order(self, side: str, qty: float) -> Fill: ...

    @abstractmethod
    def limits(self) -> Limits: ...

    def round_qty(self, qty: float) -> float:
        step = self.limits().qty_step
        return round(int(qty / step + 1e-9) * step, 12) if step > 0 else qty


class PaperBroker(Broker):
    """Simulated account. Market data comes from a real feed (public ccxt endpoint) or a
    replay; fills pay the configured fee and slippage against the bid/ask."""

    def __init__(self, symbol: str, feed, state_path: str | Path, fee_rate: float, slippage: float,
                 starting_cash: float = 10_000.0, limits: Limits | None = None):
        self.symbol, self.feed = symbol, feed
        self.fee_rate, self.slippage = fee_rate, slippage
        self.path = Path(state_path)
        self._limits = limits or Limits(min_qty=1e-5, min_notional=5.0, qty_step=1e-8)
        if self.path.exists():
            st = json.loads(self.path.read_text())
            self.cash, self.qty = st["cash"], st["qty"]
        else:
            self.cash, self.qty = starting_cash, 0.0
            self._save()

    def _save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps({"cash": self.cash, "qty": self.qty}))

    def fetch_ohlcv(self, tf, limit):
        return self.feed.ohlcv(tf, limit)

    def quote(self):
        return self.feed.quote()

    def balances(self):
        return self.cash, self.qty

    def limits(self):
        return self._limits

    def market_order(self, side, qty):
        bid, ask = self.quote()
        if side == "buy":
            price = ask * (1 + self.slippage)
            cost = qty * price
            fee = cost * self.fee_rate
            if cost + fee > self.cash + 1e-9:
                raise BrokerError("insufficient cash")
            self.cash -= cost + fee
            self.qty += qty
        else:
            if qty > self.qty + 1e-12:
                raise BrokerError("insufficient position")
            price = bid * (1 - self.slippage)
            proceeds = qty * price
            fee = proceeds * self.fee_rate
            self.cash += proceeds - fee
            self.qty -= qty
        self._save()
        return Fill(uuid.uuid4().hex[:12], side, qty, price, fee, time.time())


class CcxtFeed:
    """Public market data via ccxt (no API keys)."""

    def __init__(self, exchange_id: str, symbol: str, exchange=None):
        if exchange is None:
            import ccxt

            exchange = getattr(ccxt, exchange_id)({"enableRateLimit": True})
        self.ex, self.symbol = exchange, symbol

    def ohlcv(self, tf, limit):
        return rows_to_frame(self.ex.fetch_ohlcv(self.symbol, tf, limit=limit))

    def quote(self):
        t = self.ex.fetch_ticker(self.symbol)
        bid, ask = t.get("bid"), t.get("ask")
        if not bid or not ask or bid <= 0 or ask < bid:
            raise BrokerError(f"bad quote bid={bid} ask={ask}")
        return float(bid), float(ask)


class ReplayFeed:
    """Replays a historical frame for offline paper simulation; `now` is set by the caller."""

    def __init__(self, df: pd.DataFrame, spread: float = 0.0002):
        self.df, self.spread, self.now = df, spread, df.index[0]

    def ohlcv(self, tf, limit):
        return self.df[self.df.index <= self.now].tail(limit)

    def quote(self):
        # the open of the bar now forming == the price an order placed right after the close gets
        nxt = self.df[self.df.index > self.now]
        mid = float(nxt["open"].iloc[0]) if len(nxt) else float(self.df["close"].iloc[-1])
        return mid * (1 - self.spread), mid * (1 + self.spread)


class CcxtBroker(Broker):
    """LIVE trading. Keys come from env vars only and are never logged."""

    def __init__(self, exchange_id: str, symbol: str, exchange=None):
        if exchange is None:
            import ccxt

            key, secret = os.environ.get("EXCHANGE_API_KEY"), os.environ.get("EXCHANGE_API_SECRET")
            if not key or not secret:
                raise BrokerError("EXCHANGE_API_KEY / EXCHANGE_API_SECRET not set")
            exchange = getattr(ccxt, exchange_id)({"apiKey": key, "secret": secret, "enableRateLimit": True})
        self.ex, self.symbol = exchange, symbol
        self.feed = CcxtFeed(exchange_id, symbol, exchange)
        self.market = self.ex.load_markets()[symbol]
        self.base, self.quote_ccy = self.market["base"], self.market["quote"]

    def fetch_ohlcv(self, tf, limit):
        return self.feed.ohlcv(tf, limit)

    def quote(self):
        return self.feed.quote()

    def balances(self):
        b = self.ex.fetch_balance()
        return float(b["free"].get(self.quote_ccy, 0) or 0), float(b["total"].get(self.base, 0) or 0)

    def limits(self):
        lim = self.market.get("limits", {})
        prec = self.market.get("precision", {}).get("amount")
        return Limits(min_qty=float((lim.get("amount") or {}).get("min") or 0),
                      min_notional=float((lim.get("cost") or {}).get("min") or 0),
                      qty_step=float(prec) if isinstance(prec, float) and prec < 1 else 0.0)

    def round_qty(self, qty):
        return float(self.ex.amount_to_precision(self.symbol, qty))

    def market_order(self, side, qty):
        o = self.ex.create_order(self.symbol, "market", side, qty)
        oid = o["id"]
        for _ in range(20):  # wait for the fill; market orders normally fill immediately
            o = self.ex.fetch_order(oid, self.symbol)
            if o.get("status") in ("closed", "canceled", "expired", "rejected"):
                break
            time.sleep(1)
        filled = float(o.get("filled") or 0)
        if filled <= 0:
            raise BrokerError(f"order {oid} not filled: status={o.get('status')}")
        fee = float((o.get("fee") or {}).get("cost") or 0)
        return Fill(str(oid), side, filled, float(o.get("average") or o.get("price")), fee, time.time())


def fill_dict(f: Fill) -> dict:
    return asdict(f)
