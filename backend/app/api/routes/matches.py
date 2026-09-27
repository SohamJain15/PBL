from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.dependencies import get_match_service
from app.schemas.match import MatchDetail, MatchListItem
from app.services.match_service import MatchService

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("", response_model=list[MatchListItem])
def list_matches(svc: MatchService = Depends(get_match_service)) -> list[MatchListItem]:
    return svc.list_matches()


@router.get("/{match_id}", response_model=MatchDetail)
def match_detail(match_id: int, svc: MatchService = Depends(get_match_service)) -> MatchDetail:
    return svc.detail(match_id)
