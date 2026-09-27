from __future__ import annotations

import numpy as np

from app.core.constants import COORD_DECIMALS, MAX_FRAME_WINDOW_S, TRACKING_FPS
from app.core.exceptions import TrackingNotAvailableError
from app.data.preprocessing.quality import QualitySummary, quality_summary
from app.data.repositories.match_repository import MatchRepository
from app.schemas.tracking import FrameChunk
from app.utils.validation import validate_range


def _nullable(values: np.ndarray) -> list[float | None]:
    return [None if not np.isfinite(v) else round(float(v), COORD_DECIMALS) for v in values]


class TrackingService:
    def __init__(self, repo: MatchRepository) -> None:
        self.repo = repo

    def indices(self, match_id: int, period: int, start_s: float, end_s: float, max_span: float) -> np.ndarray:
        validate_range(start_s, end_s, max_span)
        if not self.repo.tracking_available(match_id):
            raise TrackingNotAvailableError(match_id)
        self.repo.get_meta(match_id)
        return self.repo.get_tracking(match_id).range_indices(period, start_s, end_s)

    def frames(self, match_id: int, period: int, start_s: float, end_s: float) -> FrameChunk:
        idx = self.indices(match_id, period, start_s, end_s, MAX_FRAME_WINDOW_S)
        tr = self.repo.get_tracking(match_id)
        present = (tr.flag[idx] >= 0).any(axis=0) if idx.size else np.zeros(tr.player_ids.size, bool)
        cols = np.flatnonzero(present)
        xy = np.round(tr.xy[idx][:, cols].reshape(idx.size, 2 * cols.size).astype(float), COORD_DECIMALS)
        xy_list = [[None if not np.isfinite(v) else float(v) for v in row] for row in xy]
        ball = [
            _nullable(tr.ball[i]) + [int(tr.ball_flag[i])] for i in idx
        ]
        return FrameChunk(
            match_id=match_id,
            period=period,
            start_s=start_s,
            end_s=end_s,
            fps=TRACKING_FPS,
            player_ids=[int(p) for p in tr.player_ids[cols]],
            t=[round(float(v), 2) for v in tr.t[idx]],
            frame=[int(v) for v in tr.frame[idx]],
            xy=xy_list,
            flag=tr.flag[idx][:, cols].astype(int).tolist(),
            ball=ball,
            possession=tr.possession[idx].astype(int).tolist(),
            possession_player=[None if v < 0 else int(v) for v in tr.possession_player[idx]],
        )

    def quality(self, match_id: int, period: int, start_s: float, end_s: float) -> QualitySummary:
        idx = self.indices(match_id, period, start_s, end_s, 1e9)
        return quality_summary(self.repo.get_tracking(match_id), idx)
