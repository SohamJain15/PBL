from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_heatmap_service
from app.core.constants import HEATMAP_BIN_M
from app.schemas.feature import HeatmapOut
from app.services.heatmap_service import HeatmapService

router = APIRouter(prefix="/matches/{match_id}", tags=["heatmaps"])


@router.get("/heatmap", response_model=HeatmapOut)
def heatmap(
    match_id: int,
    side: Literal["home", "away", "all"] = "home",
    period: int | None = Query(None, ge=1),
    start: float | None = Query(None, ge=0),
    end: float | None = Query(None, gt=0),
    bin: float = Query(HEATMAP_BIN_M, ge=1.0, le=10.0),
    svc: HeatmapService = Depends(get_heatmap_service),
) -> HeatmapOut:
    return svc.heatmap(match_id, side, period, start, end, bin)
