"""API tests against the real SkillCorner match. Skipped when tracking has not been downloaded."""
import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_repository
from app.core.config import get_settings
from app.main import app

MATCH = get_settings().default_match_id
pytestmark = pytest.mark.skipif(not get_repository().tracking_available(MATCH), reason="tracking not downloaded")
client = TestClient(app)


def test_match_detail():
    d = client.get(f"/api/matches/{MATCH}").json()
    assert d["home"]["name"] and d["pitch_length"] > 90
    assert d["quality"]["detected"] > 0


def test_frames_window_is_limited():
    assert client.get(f"/api/matches/{MATCH}/frames?period=1&start=0&end=500").status_code == 422


def test_frames_payload_shape():
    d = client.get(f"/api/matches/{MATCH}/frames?period=1&start=600&end=610").json()
    assert len(d["t"]) == len(d["xy"]) == len(d["ball"])
    assert all(len(row) == 2 * len(d["player_ids"]) for row in d["xy"])


def test_patterns_are_consistent():
    d = client.get(f"/api/matches/{MATCH}/patterns").json()
    assert d["k"] == len(d["clusters"])
    assert sum(c["n_windows"] for c in d["clusters"]) == d["n_windows"]
    assert sum(c["n_episodes"] for c in d["clusters"]) == len(d["episodes"])


def test_unknown_match():
    assert client.get("/api/matches/1").status_code == 404
