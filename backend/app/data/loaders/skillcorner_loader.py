"""Parser for the SkillCorner Open Data layout (https://github.com/SkillCorner/opendata).

data/raw/skillcorner/
    matches.json
    matches/{id}/{id}_match.json
    matches/{id}/{id}_tracking_extrapolated.jsonl
    matches/{id}/{id}_phases_of_play.csv
    matches/{id}/{id}_dynamic_events.csv
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from app.core.constants import (
    FLAG_DETECTED,
    FLAG_EXTRAPOLATED,
    FLAG_MISSING,
    POSSESSION_AWAY,
    POSSESSION_HOME,
    POSSESSION_NONE,
)
from app.core.exceptions import MatchNotFoundError, TrackingNotAvailableError
from app.core.logging import get_logger
from app.data.loaders.base_loader import BaseTrackingLoader
from app.models.match import MatchMeta, MatchSummary, Period, Player, Team
from app.models.sport import PlayingSurface, Sport
from app.models.tracking import TrackingData
from app.utils.coordinates import direction_from_side
from app.utils.time import parse_clock

log = get_logger(__name__)

LFS_POINTER_PREFIX = b"version https://git-lfs"
_POSSESSION_CODES = {None: POSSESSION_NONE, "home team": POSSESSION_HOME, "away team": POSSESSION_AWAY}


def _flag(is_detected: bool | None) -> int:
    if is_detected is None:
        return FLAG_MISSING
    return FLAG_DETECTED if is_detected else FLAG_EXTRAPOLATED


class SkillCornerFootballLoader(BaseTrackingLoader):
    sport = Sport.FOOTBALL

    def __init__(self, root: Path) -> None:
        self.root = root

    # ---- paths -------------------------------------------------------------------
    def match_dir(self, match_id: int) -> Path:
        return self.root / "matches" / str(match_id)

    def tracking_path(self, match_id: int) -> Path:
        return self.match_dir(match_id) / f"{match_id}_tracking_extrapolated.jsonl"

    def phases_path(self, match_id: int) -> Path:
        return self.match_dir(match_id) / f"{match_id}_phases_of_play.csv"

    # ---- index ---------------------------------------------------------------------
    def list_matches(self) -> list[MatchSummary]:
        index_path = self.root / "matches.json"
        if not index_path.exists():
            return []
        raw: list[dict[str, Any]] = json.loads(index_path.read_text())
        return [
            MatchSummary(
                id=int(m["id"]),
                date_time=m["date_time"],
                home_team=m["home_team"]["short_name"],
                away_team=m["away_team"]["short_name"],
                home_team_id=int(m["home_team"]["id"]),
                away_team_id=int(m["away_team"]["id"]),
            )
            for m in raw
        ]

    def meta_available(self, match_id: int) -> bool:
        return (self.match_dir(match_id) / f"{match_id}_match.json").exists()

    def tracking_available(self, match_id: int) -> bool:
        path = self.tracking_path(match_id)
        if not path.exists():
            return False
        with path.open("rb") as fh:
            return not fh.read(len(LFS_POINTER_PREFIX)).startswith(LFS_POINTER_PREFIX)

    # ---- metadata ------------------------------------------------------------------
    def load_meta(self, match_id: int) -> MatchMeta:
        path = self.match_dir(match_id) / f"{match_id}_match.json"
        if not path.exists():
            raise MatchNotFoundError(match_id)
        m: dict[str, Any] = json.loads(path.read_text())

        def team(key: str, side: str) -> Team:
            t, kit = m[key], m[f"{key}_kit"] or {}
            return Team(
                id=int(t["id"]),
                name=t["name"],
                short_name=t["short_name"],
                acronym=t.get("acronym") or t["short_name"][:3].upper(),
                side=side,
                color=kit.get("jersey_color") or "#cccccc",
                number_color=kit.get("number_color") or "#000000",
            )

        home, away = team("home_team", "home"), team("away_team", "away")
        side_by_team = {home.id: "home", away.id: "away"}

        players = [
            Player(
                id=int(p["id"]),
                team_id=int(p["team_id"]),
                side=side_by_team.get(int(p["team_id"]), "unknown"),
                number=p.get("number"),
                short_name=p.get("short_name") or p.get("last_name") or str(p["id"]),
                role=(p.get("player_role") or {}).get("acronym") or "",
                is_goalkeeper=((p.get("player_role") or {}).get("acronym") == "GK"),
            )
            for p in m.get("players", [])
        ]

        home_sides: list[str] = m.get("home_team_side") or []
        periods = [
            Period(
                period=int(p["period"]),
                start_frame=int(p["start_frame"]),
                end_frame=int(p["end_frame"]),
                home_direction=direction_from_side(home_sides[i]) if i < len(home_sides) else 1,
            )
            for i, p in enumerate(m.get("match_periods", []))
        ]

        comp = m.get("competition_edition") or {}
        stadium = m.get("stadium") or {}
        return MatchMeta(
            id=int(m["id"]),
            competition=(comp.get("competition") or {}).get("name", ""),
            season=(comp.get("season") or {}).get("name", ""),
            round_name=(m.get("competition_round") or {}).get("name"),
            date_time=m.get("date_time", ""),
            stadium=stadium.get("name"),
            home_score=m.get("home_team_score"),
            away_score=m.get("away_team_score"),
            home=home,
            away=away,
            surface=PlayingSurface(Sport.FOOTBALL, float(m["pitch_length"]), float(m["pitch_width"])),
            periods=periods,
            players=players,
        )

    # ---- tracking ------------------------------------------------------------------
    def load_tracking(self, match_id: int, meta: MatchMeta) -> TrackingData:
        path = self.tracking_path(match_id)
        if not self.tracking_available(match_id):
            raise TrackingNotAvailableError(match_id)

        with path.open("r") as fh:
            lines = fh.readlines()
        n = len(lines)
        player_index: dict[int, int] = {p.id: i for i, p in enumerate(meta.players)}
        capacity = len(player_index) + 16

        frame = np.zeros(n, dtype=np.int32)
        period = np.zeros(n, dtype=np.int8)
        t = np.full(n, np.nan, dtype=np.float32)
        ball = np.full((n, 3), np.nan, dtype=np.float32)
        ball_flag = np.full(n, FLAG_MISSING, dtype=np.int8)
        possession = np.zeros(n, dtype=np.int8)
        possession_player = np.full(n, -1, dtype=np.int64)
        xy = np.full((n, capacity, 2), np.nan, dtype=np.float32)
        flag = np.full((n, capacity), FLAG_MISSING, dtype=np.int8)

        for i, line in enumerate(lines):
            d = json.loads(line)
            frame[i] = d["frame"]
            period[i] = d.get("period") or 0
            ts = parse_clock(d.get("timestamp"))
            if ts is not None:
                t[i] = ts
            b = d.get("ball_data") or {}
            if b.get("x") is not None:
                ball[i] = (b["x"], b["y"], b.get("z") if b.get("z") is not None else np.nan)
                ball_flag[i] = _flag(b.get("is_detected"))
            poss = d.get("possession") or {}
            possession[i] = _POSSESSION_CODES.get(poss.get("group"), POSSESSION_NONE)
            if poss.get("player_id") is not None:
                possession_player[i] = int(poss["player_id"])
            for p in d.get("player_data") or []:
                pid = int(p["player_id"])
                j = player_index.get(pid)
                if j is None:
                    j = player_index[pid] = len(player_index)
                    if j >= capacity:
                        raise ValueError("Player capacity exceeded while parsing tracking")
                    log.warning("Player %s appears in tracking but not in match metadata", pid)
                xy[i, j] = (p["x"], p["y"])
                flag[i, j] = _flag(p.get("is_detected"))

        ids = np.zeros(capacity, dtype=np.int64)
        for pid, j in player_index.items():
            ids[j] = pid
        used = (flag != FLAG_MISSING).any(axis=0)
        log.info("Parsed %d frames, %d tracked players for match %s", n, int(used.sum()), match_id)
        return TrackingData(
            frame=frame, period=period, t=t, ball=ball, ball_flag=ball_flag, possession=possession,
            possession_player=possession_player,
            xy=xy[:, used], flag=flag[:, used], player_ids=ids[used],
        )

    # ---- phases of play (external reference labels) ---------------------------------
    def load_phases(self, match_id: int) -> pd.DataFrame | None:
        path = self.phases_path(match_id)
        if not path.exists():
            return None
        cols = [
            "frame_start", "frame_end", "period", "team_in_possession_id",
            "team_in_possession_phase_type", "team_out_of_possession_phase_type",
        ]
        return pd.read_csv(path, usecols=cols)
