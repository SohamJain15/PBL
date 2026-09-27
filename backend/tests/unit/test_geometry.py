import numpy as np
import pytest

from app.analytics.spatial.geometry import convex_hull, polygon_area


def test_square_hull_and_area():
    pts = np.array([[0, 0], [10, 0], [10, 10], [0, 10], [5, 5], [2, 7]])
    hull = convex_hull(pts)
    assert len(hull) == 4
    assert polygon_area(hull) == pytest.approx(100.0)


def test_collinear_points_have_zero_area():
    pts = np.array([[0, 0], [1, 1], [2, 2], [3, 3]])
    assert polygon_area(convex_hull(pts)) == 0.0


def test_triangle_area():
    assert polygon_area(convex_hull(np.array([[0, 0], [4, 0], [0, 3]]))) == pytest.approx(6.0)


def test_hull_is_invariant_to_order():
    rng = np.random.default_rng(0)
    pts = rng.normal(size=(30, 2))
    a = polygon_area(convex_hull(pts))
    b = polygon_area(convex_hull(pts[::-1]))
    assert a == pytest.approx(b)
