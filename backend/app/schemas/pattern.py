from __future__ import annotations

from pydantic import BaseModel, Field

from app.core.constants import DEFAULT_STEP_S, DEFAULT_WINDOW_S, MAX_WINDOW_S, MIN_WINDOW_S


class AnalyzeRequest(BaseModel):
    match_id: int
    window_s: float = Field(DEFAULT_WINDOW_S, ge=MIN_WINDOW_S, le=MAX_WINDOW_S)
    step_s: float = Field(DEFAULT_STEP_S, ge=0.2, le=MAX_WINDOW_S)
    k: int | None = Field(None, ge=2, le=12, description="fix the number of clusters; default = silhouette")


class FeatureStat(BaseModel):
    key: str
    label: str
    unit: str
    mean: float
    z: float  # cluster-mean z-score vs all windows


class InterpretationOut(BaseModel):
    label: str | None
    rules_matched: list[str]
    evidence: dict[str, float]


class EpisodeOut(BaseModel):
    id: int
    cluster_id: int
    side: str
    period: int
    start_s: float
    end_s: float
    duration_s: float
    n_windows: int
    distance_to_centroid: float


class ClusterSummary(BaseModel):
    id: int
    n_windows: int
    n_episodes: int
    avg_duration_s: float
    side_share_home: float
    representative_episode_id: int | None
    profile: list[FeatureStat]
    interpretation: InterpretationOut


class EmbeddingPoint(BaseModel):
    window_id: int
    cluster_id: int
    side: str
    period: int
    start_s: float
    x: float
    y: float


class PhaseAgreement(BaseModel):
    n_windows: int
    nmi: float | None = None
    ari: float | None = None
    labels: list[str] = []
    clusters: list[int] = []
    counts: list[list[int]] = []


class DiscoverySummary(BaseModel):
    match_id: int
    method: str
    window_s: float
    step_s: float
    n_windows: int
    k: int
    k_scores: dict[int, float]
    pca_explained: list[float]
    features: list[str]
    clusters: list[ClusterSummary]
    episodes: list[EpisodeOut]
    embedding: list[EmbeddingPoint]
    phase_agreement: PhaseAgreement | None
    rules: list[dict[str, str]]
    demo_episode_id: int | None
    runtime_s: float


class FeatureChange(BaseModel):
    key: str
    label: str
    unit: str
    start: float | None
    end: float | None


class EpisodeDetail(BaseModel):
    episode: EpisodeOut
    cluster: ClusterSummary
    changes: list[FeatureChange]
    context_before_s: float
    context_after_s: float


class ClusterDetail(BaseModel):
    cluster: ClusterSummary
    episodes: list[EpisodeOut]
