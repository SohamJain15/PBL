from app.ml.interpretation.tactical_interpreter import FootballPatternInterpreter

BASE = {k: 0.0 for k in ("d_width", "d_depth", "d_area", "d_compactness", "lateral_shift", "forward_shift",
                         "centroid_speed", "width_mean", "depth_mean", "near_ball_mean", "density_mean",
                         "ball_dist_mean", "possession_share")}


def profile(**kw):
    return {**BASE, "possession_share_raw": 0.5, **kw}


def test_no_rule_matches_neutral_profile():
    assert FootballPatternInterpreter().interpret(profile()).label is None


def test_defensive_compression():
    p = profile(d_width=-1.0, d_area=-1.2, possession_share_raw=0.1)
    assert FootballPatternInterpreter().interpret(p).label == "Defensive Compression"


def test_compression_requires_out_of_possession():
    p = profile(d_width=-1.0, d_area=-1.2, possession_share_raw=0.9)
    assert FootballPatternInterpreter().interpret(p).label != "Defensive Compression"


def test_defensive_shift():
    p = profile(lateral_shift=1.2, d_area=0.1, possession_share_raw=0.05)
    assert FootballPatternInterpreter().interpret(p).label == "Defensive Shift"


def test_wing_expansion():
    p = profile(d_width=1.0, d_area=0.9, possession_share_raw=0.8)
    assert FootballPatternInterpreter().interpret(p).label == "Wing Expansion"


def test_local_overload_and_evidence():
    res = FootballPatternInterpreter().interpret(profile(near_ball_mean=1.1))
    assert res.label == "Local Overload"
    assert "near_ball_mean" in res.evidence
