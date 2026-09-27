from __future__ import annotations

import numpy as np

from app.analytics.spatial.occupancy import occupancy_grid
from app.core.constants import HEATMAP_BIN_M, HEATMAP_SMOOTH_SIGMA_BINS
from app.data.preprocessing.cleaning import team_direction, team_player_mask
from app.data.repositories.match_repository import MatchRepository
from app.schemas.feature import HeatmapOut
from app.utils.coordinates import normalise_xy


class HeatmapService:
    """Occupancy of real player positions (goalkeepers included).

    Positions are rotated so the selected team (home for 'all') attacks towards +x, which allows
    pooling both halves.
    """

    def __init__(self, repo: MatchRepository) -> None:
        self.repo = repo
        self._cache: dict[tuple[object, ...], HeatmapOut] = {}

    def heatmap(self, match_id: int, side: str, period: int | None, start_s: float | None,
                end_s: float | None, bin_m: float = HEATMAP_BIN_M) -> HeatmapOut:
        key = (match_id, side, period, start_s, end_s, bin_m)
        if key in self._cache:
            return self._cache[key]
        meta = self.repo.get_meta(match_id)
        tr = self.repo.get_tracking(match_id)
        periods = [period] if period else [p.period for p in meta.periods]
        chunks: list[np.ndarray] = []
        for p in periods:
            idx = tr.range_indices(p, start_s, end_s) if start_s is not None and end_s is not None else tr.period_indices(p)
            if side == "all":
                pos = tr.xy[idx].reshape(-1, 2)
                reference = "home"
            else:
                pos = tr.xy[idx][:, team_player_mask(meta, tr, side, outfield_only=False)].reshape(-1, 2)
                reference = side
            chunks.append(normalise_xy(pos, team_direction(meta, reference, p)))
        positions = np.concatenate(chunks) if chunks else np.zeros((0, 2))
        positions = positions[np.all(np.isfinite(positions), axis=1)]
        grid, x_edges, y_edges = occupancy_grid(
            positions, meta.surface.length, meta.surface.width, bin_m, HEATMAP_SMOOTH_SIGMA_BINS)
        out = HeatmapOut(
            match_id=match_id, side=side, period=period, start_s=start_s, end_s=end_s, bin_m=bin_m,
            nx=grid.shape[1], ny=grid.shape[0], x_min=float(x_edges[0]), y_min=float(y_edges[0]),
            samples=int(positions.shape[0]), grid=np.round(grid, 6).tolist(),
            normalised_direction=True,
        )
        self._cache[key] = out
        return out
