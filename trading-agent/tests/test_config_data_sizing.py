from dataclasses import replace
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from tradeagent.config import Config, ConfigError, Costs, Sizing, load_config, validate
from tradeagent.data import (check_quality, dataset_hash, drop_unclosed, load_csv, rows_to_frame,
                             save_csv, timeframe_seconds)
from tradeagent.sizing import kelly_weight, vol_target_weights

ROOT = Path(__file__).resolve().parents[1]


def test_default_toml_loads():
    cfg = load_config(ROOT / "config" / "default.toml")
    assert cfg.mode == "paper" and cfg.sizing.kelly_fraction <= 0.5


def test_full_kelly_refused():
    with pytest.raises(ConfigError, match="Kelly"):
        validate(replace(Config(), sizing=Sizing(kelly_fraction=1.0)))


def test_zero_costs_refused():
    with pytest.raises(ConfigError, match="zero-cost"):
        validate(replace(Config(), costs=Costs(0, 0, 0)))


def test_unknown_key_refused(tmp_path):
    p = tmp_path / "c.toml"
    p.write_text('[risk]\nmax_drawdwn_pct = 0.1\n')
    with pytest.raises(ConfigError, match="unknown"):
        load_config(p)


def test_leverage_refused():
    with pytest.raises(ConfigError):
        validate(replace(Config(), sizing=Sizing(max_position_weight=2.0)))


def test_quality_checks(df):
    assert check_quality(df, "1d").ok
    bad = pd.concat([df, df.iloc[[-1]]])
    assert not check_quality(bad, "1d").ok
    nan = df.copy()
    nan.iloc[5, 0] = np.nan
    assert not check_quality(nan, "1d").ok
    hl = df.copy()
    hl.iloc[7, hl.columns.get_loc("high")] = hl["low"].iloc[7] * 0.5
    assert not check_quality(hl, "1d").ok
    gap = df.drop(df.index[100:105])
    rep = check_quality(gap, "1d")
    assert rep.ok and any("gaps" in w for w in rep.warnings)


def test_drop_unclosed_and_roundtrip(df, tmp_path):
    now = df.index[-1] + pd.Timedelta(hours=12)  # last bar still forming
    assert drop_unclosed(df, "1d", now).index[-1] == df.index[-2]
    p = tmp_path / "x.csv"
    save_csv(df, p)
    back = load_csv(p)
    assert dataset_hash(back) == dataset_hash(df)
    assert timeframe_seconds("4h") == 14400


def test_rows_to_frame_dedupes():
    rows = [[0, 1, 2, 0.5, 1.5, 10], [0, 1, 2, 0.5, 1.6, 10], [86400000, 1, 2, 0.5, 1, 1]]
    f = rows_to_frame(rows)
    assert len(f) == 2 and f["close"].iloc[0] == 1.6


def test_kelly_capped_and_refuses_full():
    rng = np.random.default_rng(0)
    r = pd.Series(rng.normal(0.001, 0.02, 500))
    assert kelly_weight(r, 0.25) == pytest.approx(0.25 * r.mean() / r.var(), rel=1e-9)
    assert kelly_weight(-r.abs(), 0.25) == 0
    with pytest.raises(ValueError):
        kelly_weight(r, 1.0)


def test_vol_target_bounds(df):
    sig = pd.Series(1.0, index=df.index)
    w = vol_target_weights(df, sig, 365, 0.2, 1.0, kelly_cap=0.4)
    assert w.max() <= 0.4 + 1e-12 and w.min() >= 0
    assert (w.iloc[:30] == 0).all()  # no vol estimate yet -> no position
