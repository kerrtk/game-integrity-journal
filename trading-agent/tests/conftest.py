import sys
from dataclasses import replace
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tradeagent.config import Config, Engine, Validation  # noqa: E402
from tradeagent.data import synthetic_ohlcv  # noqa: E402


@pytest.fixture
def df():
    return synthetic_ohlcv(n=1500, seed=1)


@pytest.fixture
def cfg(tmp_path):
    c = Config()
    return replace(c,
                   engine=Engine(poll_seconds=0, state_dir=str(tmp_path / "state"),
                                 log_file=str(tmp_path / "state" / "decisions.jsonl")),
                   validation=replace(Validation(), mc_paths=200))
