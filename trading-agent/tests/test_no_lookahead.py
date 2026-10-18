"""The single most important property: nothing computed at bar t may change when
future bars are added or altered."""
import numpy as np
import pandas as pd
import pytest

from tradeagent.data import periods_per_year
from tradeagent.regime import label, stay_out_mask
from tradeagent.strategies import CANDIDATES
from tradeagent.validation import target_weights


@pytest.mark.parametrize("strat", CANDIDATES, ids=lambda s: s.name)
def test_signals_are_causal(df, cfg, strat):
    ppy = periods_per_year("1d")
    for params in strat.param_sets()[:: max(1, len(strat.param_sets()) // 4)]:
        full = target_weights(df, strat, params, cfg, ppy, kelly_cap=0.8)
        for cut in (400, 777, 1100):
            part = target_weights(df.iloc[:cut], strat, params, cfg, ppy, kelly_cap=0.8)
            pd.testing.assert_series_equal(part, full.iloc[:cut], check_names=False)


@pytest.mark.parametrize("strat", CANDIDATES, ids=lambda s: s.name)
def test_future_shock_does_not_change_past(df, cfg, strat):
    ppy = periods_per_year("1d")
    params = strat.param_sets()[0]
    shocked = df.copy()
    shocked.iloc[1000:, :4] *= 3.0  # wild future
    a = target_weights(df, strat, params, cfg, ppy)
    b = target_weights(shocked, strat, params, cfg, ppy)
    pd.testing.assert_series_equal(a.iloc[:1000], b.iloc[:1000], check_names=False)


def test_regime_labels_causal(df):
    ppy = periods_per_year("1d")
    full = label(df, ppy)
    part = label(df.iloc[:900], ppy)
    pd.testing.assert_frame_equal(part, full.iloc[:900])
    np.testing.assert_array_equal(stay_out_mask(df.iloc[:900], ppy).to_numpy(),
                                  stay_out_mask(df, ppy).iloc[:900].to_numpy())
