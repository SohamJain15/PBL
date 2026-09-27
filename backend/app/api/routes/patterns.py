from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_pattern_service
from app.core.constants import DEFAULT_STEP_S, DEFAULT_WINDOW_S, MAX_WINDOW_S, MIN_WINDOW_S
from app.schemas.pattern import ClusterDetail, DiscoverySummary, EpisodeDetail
from app.services.pattern_service import PatternService

router = APIRouter(prefix="/matches/{match_id}", tags=["patterns"])

WindowQ = Query(DEFAULT_WINDOW_S, ge=MIN_WINDOW_S, le=MAX_WINDOW_S)
StepQ = Query(DEFAULT_STEP_S, ge=0.2, le=MAX_WINDOW_S)
KQ = Query(None, ge=2, le=12)


@router.get("/patterns", response_model=DiscoverySummary)
def patterns(match_id: int, window: float = WindowQ, step: float = StepQ, k: int | None = KQ,
             svc: PatternService = Depends(get_pattern_service)) -> DiscoverySummary:
    return svc.summary(match_id, window, step, k)


@router.get("/patterns/{cluster_id}", response_model=ClusterDetail)
def pattern_detail(match_id: int, cluster_id: int, window: float = WindowQ, step: float = StepQ,
                   k: int | None = KQ, svc: PatternService = Depends(get_pattern_service)) -> ClusterDetail:
    return svc.cluster_detail(match_id, cluster_id, window, step, k)


@router.get("/episodes/{episode_id}", response_model=EpisodeDetail)
def episode_detail(match_id: int, episode_id: int, window: float = WindowQ, step: float = StepQ,
                   k: int | None = KQ, svc: PatternService = Depends(get_pattern_service)) -> EpisodeDetail:
    return svc.episode_detail(match_id, episode_id, window, step, k)
