"""Selection helpers that turn the dense tracking arrays into team-specific views."""
from __future__ import annotations

import numpy as np

from app.models.match import MatchMeta
from app.models.tracking import TrackingData


def team_player_mask(meta: MatchMeta, tracking: TrackingData, side: str, outfield_only: bool = True) -> np.ndarray:
    """Boolean mask over tracking players belonging to ``side``.

    Goalkeepers are identified from the provider's role metadata (``GK``) and excluded from
    team-shape metrics when ``outfield_only`` is set, as is standard in team-shape literature.
    """
    by_id = {p.id: p for p in meta.players}
    mask = np.zeros(tracking.player_ids.shape[0], dtype=bool)
    for j, pid in enumerate(tracking.player_ids):
        p = by_id.get(int(pid))
        if p is None or p.side != side:
            continue
        if outfield_only and p.is_goalkeeper:
            continue
        mask[j] = True
    return mask


def team_direction(meta: MatchMeta, side: str, period: int) -> int:
    """+1 if ``side`` attacks towards +x in ``period`` else -1."""
    home_dir = meta.period(period).home_direction
    return home_dir if side == "home" else -home_dir
