import numpy as np
import pandas as pd
import pytest

from app.analytics.temporal.dynamics import edge_delta, kinematics, path_speed
from app.analytics.temporal.sequences import merge_runs
from app.analytics.temporal.windows import sliding_windows


def test_windows_respect_periods_and_step():
    dt = 0.2
    t = np.concatenate([np.arange(0, 10, dt), np.arange(2700, 2710, dt)])
    period = np.array([1] * 50 + [2] * 50)
    ws = sliding_windows(t, period, window_s=5.0, step_s=1.0, sample_dt=dt)
    assert {w.period for w in ws} == {1, 2}
    assert all(w.end - w.start == 25 for w in ws)
    p1 = [w for w in ws if w.period == 1]
    assert [w.start_s for w in p1[:3]] == pytest.approx([0.0, 1.0, 2.0])


def test_windows_skip_time_gaps():
    dt = 0.2
    t = np.concatenate([np.arange(0, 4, dt), np.arange(20, 30, dt)])
    period = np.ones(t.size, dtype=int)
    ws = sliding_windows(t, period, 5.0, 1.0, dt)
    assert all(w.start_s >= 20 for w in ws)


def test_edge_delta():
    v = np.array([1, 1, 2, 3, 5, 5], dtype=float)
    assert edge_delta(v, 2) == pytest.approx(4.0)


def test_kinematics_constant_velocity():
    t = np.arange(0, 5, 0.1)
    xy = np.stack([3.0 * t, np.zeros_like(t)], axis=1)  # 3 m/s along x
    k = kinematics(xy)
    assert np.nanmedian(k.speed) == pytest.approx(3.0, rel=1e-3)
    assert k.distance_m == pytest.approx(3.0 * 4.9 - 3.0 * 0.4, rel=0.05)  # smoothing trims the edges
    assert np.nanmedian(k.heading_deg) == pytest.approx(0.0, abs=1e-6)


def test_kinematics_rejects_implausible_jumps():
    xy = np.zeros((20, 2))
    xy[10:] = 50.0  # teleport
    assert np.nanmax(kinematics(xy).speed) <= 12.5


def test_path_speed():
    x = np.array([0.0, 1.0, 2.0]); y = np.zeros(3)
    assert path_speed(x, y, 1.0) == pytest.approx(2.0)


def test_merge_runs_groups_contiguous_windows():
    df = pd.DataFrame({
        "side": ["home"] * 5,
        "period": [1] * 5,
        "start_s": [0.0, 1.0, 2.0, 3.0, 10.0],
        "end_s": [5.0, 6.0, 7.0, 8.0, 15.0],
        "cluster": [0, 0, 1, 1, 1],
    })
    runs = merge_runs(df, step_s=1.0)
    assert [(r.cluster, r.start_s, r.end_s, len(r.row_indices)) for r in runs] == [
        (0, 0.0, 6.0, 2), (1, 2.0, 8.0, 2), (1, 10.0, 15.0, 1)
    ]
