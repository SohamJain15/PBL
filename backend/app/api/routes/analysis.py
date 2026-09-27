from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.dependencies import get_pattern_service
from app.schemas.pattern import AnalyzeRequest, DiscoverySummary
from app.services.pattern_service import PatternService

router = APIRouter(tags=["analysis"])


@router.post("/analyze", response_model=DiscoverySummary)
def analyze(req: AnalyzeRequest, svc: PatternService = Depends(get_pattern_service)) -> DiscoverySummary:
    """Run (or fetch from cache) pattern discovery with custom window / step / k."""
    return svc.summary(req.match_id, req.window_s, req.step_s, req.k)
