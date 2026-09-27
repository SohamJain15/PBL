from __future__ import annotations

from app.core.constants import TRACKING_FPS
from app.data.preprocessing.quality import quality_summary
from app.data.repositories.match_repository import MatchRepository
from app.schemas.match import MatchDetail, MatchListItem, PeriodOut, PlayerOut, QualityOut, TeamOut


class MatchService:
    def __init__(self, repo: MatchRepository) -> None:
        self.repo = repo
        self._detail_cache: dict[int, MatchDetail] = {}

    def list_matches(self) -> list[MatchListItem]:
        items = [
            MatchListItem(
                id=m.id,
                date_time=m.date_time,
                home_team=m.home_team,
                away_team=m.away_team,
                metadata_available=self.repo.meta_available(m.id),
                tracking_available=self.repo.tracking_available(m.id),
            )
            for m in self.repo.list_matches()
        ]
        return sorted(items, key=lambda m: m.date_time)

    def detail(self, match_id: int) -> MatchDetail:
        if match_id in self._detail_cache:
            return self._detail_cache[match_id]
        meta = self.repo.get_meta(match_id)
        available = self.repo.tracking_available(match_id)
        quality = None
        if available:
            tr = self.repo.get_tracking(match_id)
            idx = (tr.period > 0).nonzero()[0]
            quality = QualityOut(**quality_summary(tr, idx).__dict__)
        detail = MatchDetail(
            id=meta.id,
            sport=meta.surface.sport.value,
            competition=meta.competition,
            season=meta.season,
            round_name=meta.round_name,
            date_time=meta.date_time,
            stadium=meta.stadium,
            home_score=meta.home_score,
            away_score=meta.away_score,
            home=TeamOut(**meta.home.__dict__),
            away=TeamOut(**meta.away.__dict__),
            pitch_length=meta.surface.length,
            pitch_width=meta.surface.width,
            fps=TRACKING_FPS,
            periods=[PeriodOut(period=p.period, start_s=p.start_s, end_s=p.end_s, home_direction=p.home_direction)
                     for p in meta.periods],
            players=[PlayerOut(**p.__dict__) for p in meta.players],
            tracking_available=available,
            quality=quality,
        )
        if available:
            self._detail_cache[match_id] = detail
        return detail
