from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_goal_service
from app.schemas.goal import GoalAnalysisOut, GoalEventOut
from app.services.goal_service import GoalService

router = APIRouter(prefix="/matches/{match_id}", tags=["goals"])


@router.get("/goals", response_model=list[GoalEventOut])
def goals(match_id: int, svc: GoalService = Depends(get_goal_service)) -> list[GoalEventOut]:
    return svc.goals(match_id)


@router.get("/goals/{goal_id}/analysis", response_model=GoalAnalysisOut)
def goal_analysis(match_id: int, goal_id: int, svc: GoalService = Depends(get_goal_service)) -> GoalAnalysisOut:
    try:
        return svc.analysis(match_id, goal_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc