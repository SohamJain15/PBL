from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_feature_service
from app.schemas.feature import ShapeTimelineOut, WindowSummaryOut
from app.schemas.tracking import RangeFeatures
from app.services.feature_service import FeatureService

router = APIRouter(prefix="/matches/{match_id}", tags=["features"])


@router.get("/features", response_model=RangeFeatures)
def features(
    match_id: int,
    period: int = Query(..., ge=1),
    start: float = Query(..., ge=0),
    end: float = Query(..., gt=0),
    svc: FeatureService = Depends(get_feature_service),
) -> RangeFeatures:
    return svc.range_features(match_id, period, start, end)


@router.get("/shape-timeline", response_model=ShapeTimelineOut)
def shape_timeline(
    match_id: int,
    period: int = Query(..., ge=1),
    bin: float = Query(30.0, ge=5.0, le=300.0, description="bin size in seconds"),
    svc: FeatureService = Depends(get_feature_service),
) -> ShapeTimelineOut:
    return svc.shape_timeline(match_id, period, bin)


@router.get("/window-summary", response_model=WindowSummaryOut)
def window_summary(
    match_id: int,
    period: int = Query(..., ge=1),
    start: float = Query(..., ge=0),
    end: float = Query(..., gt=0),
    svc: FeatureService = Depends(get_feature_service),
) -> WindowSummaryOut:
    return svc.window_summary(match_id, period, start, end)
