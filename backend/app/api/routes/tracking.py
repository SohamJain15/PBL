from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_tracking_service
from app.schemas.match import QualityOut
from app.schemas.tracking import FrameChunk
from app.services.tracking_service import TrackingService

router = APIRouter(prefix="/matches/{match_id}", tags=["tracking"])


@router.get("/frames", response_model=FrameChunk)
def frames(
    match_id: int,
    period: int = Query(..., ge=1),
    start: float = Query(..., ge=0, description="match clock, seconds"),
    end: float = Query(..., gt=0),
    svc: TrackingService = Depends(get_tracking_service),
) -> FrameChunk:
    return svc.frames(match_id, period, start, end)


@router.get("/quality", response_model=QualityOut)
def quality(
    match_id: int,
    period: int = Query(..., ge=1),
    start: float = Query(..., ge=0),
    end: float = Query(..., gt=0),
    svc: TrackingService = Depends(get_tracking_service),
) -> QualityOut:
    return QualityOut(**svc.quality(match_id, period, start, end).__dict__)
