"""Fixed-length, interpretable vector representation of a team-window.

This is the component to swap for learned representations (autoencoders, sequence models,
graph embeddings) later: anything that maps a window to a vector plugs into the same pipeline.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from app.analytics.temporal.dynamics import edge_delta, path_speed
from app.analytics.temporal.windows import Window
from app.core.constants import EDGE_SPAN_S, MIN_WINDOW_COVERAGE
from app.models.feature import ShapeSeries

# Features fed to the clustering model (order matters for centres / profiles).
CLUSTER_FEATURES: list[str] = [
    "d_width",
    "d_depth",
    "d_area",
    "d_compactness",
    "lateral_shift",
    "forward_shift",
    "centroid_speed",
    "width_mean",
    "depth_mean",
    "near_ball_mean",
    "density_mean",
    "ball_dist_mean",
    "possession_share",
]

FEATURE_LABELS: dict[str, tuple[str, str]] = {
    "d_width": ("Width Δ", "m"),
    "d_depth": ("Depth Δ", "m"),
    "d_area": ("Area Δ", "m²"),
    "d_compactness": ("Compactness Δ", ""),
    "lateral_shift": ("Lateral shift", "m"),
    "forward_shift": ("Forward shift", "m"),
    "centroid_speed": ("Centroid speed", "m/s"),
    "width_mean": ("Width", "m"),
    "depth_mean": ("Depth", "m"),
    "area_mean": ("Area", "m²"),
    "compactness_mean": ("Compactness", ""),
    "near_ball_mean": ("Players ≤10 m of ball", ""),
    "density_mean": ("Ball-area density", "/100 m²"),
    "ball_dist_mean": ("Ball–centroid dist.", "m"),
    "possession_share": ("In possession", "share"),
}

_EDGE_COLUMNS = ("width", "depth", "area", "compactness", "centroid_x", "centroid_y")


def window_row(series: ShapeSeries, w: Window, sample_dt: float) -> dict[str, float] | None:
    sl = slice(w.start, w.end)
    valid = series.valid[sl]
    if valid.mean() < MIN_WINDOW_COVERAGE:
        return None
    edge = max(1, int(round(EDGE_SPAN_S / sample_dt)))
    duration = w.end_s - w.start_s
    with np.errstate(all="ignore"):
        row: dict[str, float] = {
            "d_width": edge_delta(series.width[sl], edge),
            "d_depth": edge_delta(series.depth[sl], edge),
            "d_area": edge_delta(series.area[sl], edge),
            "d_compactness": edge_delta(series.compactness[sl], edge),
            "lateral_shift": abs(edge_delta(series.centroid_y[sl], edge)),
            "forward_shift": edge_delta(series.centroid_x[sl], edge),
            "centroid_speed": path_speed(series.centroid_x[sl], series.centroid_y[sl], duration),
            "width_mean": float(np.nanmean(series.width[sl])),
            "depth_mean": float(np.nanmean(series.depth[sl])),
            "area_mean": float(np.nanmean(series.area[sl])),
            "compactness_mean": float(np.nanmean(series.compactness[sl])),
            "near_ball_mean": float(np.nanmean(series.near_ball_10[sl])),
            "density_mean": float(np.nanmean(series.density[sl])),
            "ball_dist_mean": float(np.nanmean(series.ball_centroid_dist[sl])),
            "possession_share": float(series.in_possession[sl].mean()),
        }
        for col in _EDGE_COLUMNS:
            values = getattr(series, col)[sl]
            row[f"{col}_start"] = float(np.nanmean(values[:edge]))
            row[f"{col}_end"] = float(np.nanmean(values[-edge:]))
    return row


def build_window_table(
    series_by_side: dict[str, ShapeSeries], windows: list[Window], sample_dt: float
) -> pd.DataFrame:
    rows: list[dict[str, object]] = []
    for side, series in series_by_side.items():
        for w in windows:
            feats = window_row(series, w, sample_dt)
            if feats is None:
                continue
            rows.append({
                "side": side,
                "period": w.period,
                "start_s": round(w.start_s, 1),
                "end_s": round(w.end_s, 1),
                "start_index": int(series.frame_index[w.start]),
                "end_index": int(series.frame_index[w.end - 1]),
                **feats,
            })
    table = pd.DataFrame(rows)
    if table.empty:
        return table
    table = table.dropna(subset=CLUSTER_FEATURES).reset_index(drop=True)
    table.insert(0, "window_id", np.arange(len(table)))
    return table
