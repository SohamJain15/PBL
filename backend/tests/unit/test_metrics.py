import math

import numpy as np
import pytest

from app.analytics.metrics.compactness import compactness_index, stretch_index
from app.analytics.metrics.depth import team_depth
from app.analytics.metrics.proximity import players_within
from app.analytics.metrics.width import team_width
from app.analytics.spatial.density import local_density

PTS = np.array([[-10.0, -20.0], [10.0, 20.0], [0.0, 0.0], [5.0, -5.0]])


def test_width_and_depth():
    assert team_width(PTS) == pytest.approx(40.0)
    assert team_depth(PTS) == pytest.approx(20.0)


def test_width_needs_two_players():
    assert math.isnan(team_width(PTS[:1]))


def test_stretch_index_of_symmetric_square():
    square = np.array([[1, 1], [-1, 1], [-1, -1], [1, -1]], dtype=float)
    assert stretch_index(square) == pytest.approx(math.sqrt(2))


def test_compactness_bounds_and_monotonicity():
    r = 61.8
    assert compactness_index(0.0, r) == 1.0
    assert compactness_index(r * 2, r) == 0.0
    assert compactness_index(5.0, r) > compactness_index(10.0, r)
    assert math.isnan(compactness_index(float("nan"), r))


def test_players_within_radius():
    assert players_within(PTS, np.array([0.0, 0.0]), 7.5) == 2
    assert players_within(PTS, np.array([np.nan, 0.0]), 100) == 0


def test_local_density_units():
    # 2 players inside a 10 m disc -> 2 / (pi*100) * 100 per 100 m^2
    d = local_density(PTS, np.array([0.0, 0.0]), 10.0, 100.0)
    assert d == pytest.approx(2 / math.pi)
    assert math.isnan(local_density(PTS, np.array([np.nan, np.nan]), 10.0, 100.0))
