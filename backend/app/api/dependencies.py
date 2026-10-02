"""Service singletons wired once per process."""
from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings
from app.data.loaders.skillcorner_loader import SkillCornerFootballLoader
from app.data.repositories.match_repository import MatchRepository
from app.services.feature_service import FeatureService
from app.services.heatmap_service import HeatmapService
from app.services.goal_service import GoalService
from app.services.match_service import MatchService
from app.services.pattern_service import PatternService
from app.services.tracking_service import TrackingService


@lru_cache
def get_repository() -> MatchRepository:
    s = get_settings()
    return MatchRepository(SkillCornerFootballLoader(s.raw_dir), s.processed_dir)


@lru_cache
def get_match_service() -> MatchService:
    return MatchService(get_repository())


@lru_cache
def get_tracking_service() -> TrackingService:
    return TrackingService(get_repository())


@lru_cache
def get_feature_service() -> FeatureService:
    return FeatureService(get_repository(), get_settings().features_dir)


@lru_cache
def get_pattern_service() -> PatternService:
    return PatternService(get_feature_service(), get_settings().cache_dir)


@lru_cache
def get_heatmap_service() -> HeatmapService:
    return HeatmapService(get_repository())


@lru_cache
def get_goal_service() -> GoalService:
    return GoalService(get_repository(), get_feature_service(), get_pattern_service())
