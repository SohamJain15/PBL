"""Frame-level team-shape extraction (FootballTeamShapeExtractor)."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.analytics.metrics.compactness import compactness_index, stretch_index
from app.analytics.metrics.depth import team_depth
from app.analytics.metrics.proximity import players_within
from app.analytics.metrics.width import team_width
from app.analytics.spatial.density import local_density
from app.analytics.spatial.geometry import convex_hull, polygon_area
from app.core.constants import (
    BALL_PROXIMITY_RADII_M,
    DENSITY_AREA_UNIT_M2,
    DENSITY_RADIUS_M,
    MIN_OUTFIELD_PLAYERS,
    MIN_PLAYERS_FOR_HULL,
    POSSESSION_AWAY,
    POSSESSION_HOME,
)
from app.data.preprocessing.cleaning import team_direction, team_player_mask
from app.models.feature import ShapeSeries
from app.models.match import MatchMeta
from app.models.tracking import TrackingData
from app.utils.coordinates import normalise_xy

R_NEAR, R_FAR = BALL_PROXIMITY_RADII_M


@dataclass(frozen=True)
class FrameShape:
    width: float
    depth: float
    area: float
    stretch: float
    compactness: float
    centroid: np.ndarray  # raw pitch coordinates
    hull: np.ndarray  # raw pitch coordinates (H, 2)


def frame_shape(points: np.ndarray, half_diagonal: float) -> FrameShape | None:
    """Shape metrics for one team in one frame. ``points``: finite (n, 2) outfield positions."""
    if points.shape[0] < MIN_OUTFIELD_PLAYERS:
        return None
    hull = convex_hull(points) if points.shape[0] >= MIN_PLAYERS_FOR_HULL else points
    s = stretch_index(points)
    return FrameShape(
        width=team_width(points),
        depth=team_depth(points),
        area=polygon_area(hull),
        stretch=s,
        compactness=compactness_index(s, half_diagonal),
        centroid=points.mean(axis=0),
        hull=hull,
    )


class FootballTeamShapeExtractor:
    def __init__(self, meta: MatchMeta, tracking: TrackingData) -> None:
        self.meta = meta
        self.tracking = tracking
        self.half_diagonal = meta.surface.half_diagonal
        self._outfield = {s: team_player_mask(meta, tracking, s, outfield_only=True) for s in ("home", "away")}
        self._all_players = (tracking.flag >= 0)

    def team_points(self, index: int, side: str) -> np.ndarray:
        pts = self.tracking.xy[index, self._outfield[side]]
        return pts[np.all(np.isfinite(pts), axis=1)]

    def all_points(self, index: int) -> np.ndarray:
        pts = self.tracking.xy[index]
        return pts[np.all(np.isfinite(pts), axis=1)]

    def series(self, side: str, indices: np.ndarray, with_hulls: bool = False) -> tuple[ShapeSeries, list[np.ndarray | None]]:
        n = indices.size
        cols = {k: np.full(n, np.nan) for k in (
            "width", "depth", "area", "stretch", "compactness", "centroid_x", "centroid_y",
            "ball_centroid_dist", "near_ball_10", "near_ball_20", "density")}
        valid = np.zeros(n, dtype=bool)
        hulls: list[np.ndarray | None] = []
        poss_code = POSSESSION_HOME if side == "home" else POSSESSION_AWAY
        tr = self.tracking

        for k, idx in enumerate(indices):
            shape = frame_shape(self.team_points(int(idx), side), self.half_diagonal)
            if shape is None:
                hulls.append(None)
                continue
            valid[k] = True
            period = int(tr.period[idx])
            direction = team_direction(self.meta, side, period) if period else 1
            cx, cy = normalise_xy(shape.centroid, direction)
            ball_xy = tr.ball[idx, :2].astype(float)
            pts = self.team_points(int(idx), side)
            cols["width"][k] = shape.width
            cols["depth"][k] = shape.depth
            cols["area"][k] = shape.area
            cols["stretch"][k] = shape.stretch
            cols["compactness"][k] = shape.compactness
            cols["centroid_x"][k] = cx
            cols["centroid_y"][k] = cy
            if np.all(np.isfinite(ball_xy)):
                cols["ball_centroid_dist"][k] = float(np.linalg.norm(shape.centroid - ball_xy))
                cols["near_ball_10"][k] = players_within(pts, ball_xy, R_NEAR)
                cols["near_ball_20"][k] = players_within(pts, ball_xy, R_FAR)
                cols["density"][k] = local_density(
                    self.all_points(int(idx)), ball_xy, DENSITY_RADIUS_M, DENSITY_AREA_UNIT_M2)
            if with_hulls:
                hulls.append(shape.hull)

        series = ShapeSeries(
            side=side,
            t=tr.t[indices].astype(float),
            frame_index=indices,
            in_possession=tr.possession[indices] == poss_code,
            valid=valid,
            **cols,
        )
        return series, hulls
