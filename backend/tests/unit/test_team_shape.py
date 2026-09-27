import numpy as np
import pytest

from app.analytics.spatial.occupancy import occupancy_grid
from app.analytics.spatial.team_shape import frame_shape
from app.utils.coordinates import direction_from_side, normalise_xy
from app.utils.time import parse_clock


def test_frame_shape_requires_minimum_players():
    assert frame_shape(np.zeros((3, 2)), 60.0) is None


def test_frame_shape_grid_formation():
    xs, ys = np.meshgrid([-10.0, 0.0, 10.0], [-15.0, 0.0, 15.0])
    pts = np.stack([xs.ravel(), ys.ravel()], axis=1)  # 9 players, 20 x 30 m block
    s = frame_shape(pts, 61.8)
    assert s is not None
    assert s.width == pytest.approx(30.0)
    assert s.depth == pytest.approx(20.0)
    assert s.area == pytest.approx(600.0)
    assert 0 < s.compactness < 1


def test_normalisation_is_rotation():
    xy = np.array([[10.0, 5.0]])
    assert np.allclose(normalise_xy(xy, -1), [[-10.0, -5.0]])
    assert direction_from_side("left_to_right") == 1
    assert direction_from_side("right_to_left") == -1


def test_parse_clock():
    assert parse_clock("00:45:00.10") == pytest.approx(2700.1)
    assert parse_clock(None) is None


def test_occupancy_grid_sums_to_one_and_locates_mass():
    pos = np.array([[40.0, 20.0]] * 100)
    grid, xe, ye = occupancy_grid(pos, 104, 68, 2.0, 0.0)
    assert grid.sum() == pytest.approx(1.0)
    iy, ix = np.unravel_index(grid.argmax(), grid.shape)
    assert xe[ix] <= 40 < xe[ix + 1] and ye[iy] <= 20 < ye[iy + 1]
