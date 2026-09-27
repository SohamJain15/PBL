"""Kinematics from positional time series."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.core.constants import FRAME_DT, MAX_PLAUSIBLE_SPEED_MS, SPEED_SMOOTHING_FRAMES


def moving_average(values: np.ndarray, window: int) -> np.ndarray:
    """Centred moving average along axis 0 that propagates NaN (no smoothing across gaps)."""
    if window <= 1:
        return values.astype(float)
    kernel = np.ones(window) / window
    out = np.full(values.shape, np.nan)
    half = window // 2
    for col in range(values.shape[1]):
        conv = np.convolve(values[:, col], kernel, mode="valid")
        out[half : half + conv.size, col] = conv
    return out


@dataclass(frozen=True)
class Kinematics:
    speed: np.ndarray  # m/s per frame (NaN where unknown)
    acceleration: np.ndarray  # m/s^2
    heading_deg: np.ndarray  # direction of motion, 0 = +x, counter-clockwise
    distance_m: float


def kinematics(xy: np.ndarray, dt: float = FRAME_DT, smoothing: int = SPEED_SMOOTHING_FRAMES) -> Kinematics:
    """Speed / acceleration / heading for a single trajectory (n, 2)."""
    smooth = moving_average(xy.astype(float), smoothing)
    v = np.gradient(smooth, dt, axis=0) if xy.shape[0] > 1 else np.full_like(smooth, np.nan)
    speed = np.linalg.norm(v, axis=1)
    speed[speed > MAX_PLAUSIBLE_SPEED_MS] = np.nan
    accel = np.gradient(speed, dt) if speed.size > 1 else np.full_like(speed, np.nan)
    heading = np.degrees(np.arctan2(v[:, 1], v[:, 0]))
    step = np.linalg.norm(np.diff(smooth, axis=0), axis=1)
    step = step[np.isfinite(step) & (step <= MAX_PLAUSIBLE_SPEED_MS * dt)]
    return Kinematics(speed=speed, acceleration=accel, heading_deg=heading, distance_m=float(step.sum()))


def edge_delta(values: np.ndarray, edge: int) -> float:
    """mean(last ``edge`` samples) - mean(first ``edge`` samples), ignoring NaN."""
    if values.size < 2 * edge:
        return float("nan")
    with np.errstate(all="ignore"):
        return float(np.nanmean(values[-edge:]) - np.nanmean(values[:edge]))


def path_speed(x: np.ndarray, y: np.ndarray, duration_s: float) -> float:
    """Mean speed of a point along its (NaN-free) path."""
    ok = np.isfinite(x) & np.isfinite(y)
    if ok.sum() < 2 or duration_s <= 0:
        return float("nan")
    return float(np.hypot(np.diff(x[ok]), np.diff(y[ok])).sum() / duration_s)
