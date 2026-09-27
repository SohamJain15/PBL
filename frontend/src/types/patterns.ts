import type { Side } from "./match";

export interface AnalysisParams {
  window_s: number;
  step_s: number;
  k: number | null;
}

export interface FeatureStat {
  key: string;
  label: string;
  unit: string;
  mean: number;
  z: number;
}

export interface Interpretation {
  label: string | null;
  rules_matched: string[];
  evidence: Record<string, number>;
}

export interface Episode {
  id: number;
  cluster_id: number;
  side: Side;
  period: number;
  start_s: number;
  end_s: number;
  duration_s: number;
  n_windows: number;
  distance_to_centroid: number;
}

export interface ClusterSummary {
  id: number;
  n_windows: number;
  n_episodes: number;
  avg_duration_s: number;
  side_share_home: number;
  representative_episode_id: number | null;
  profile: FeatureStat[];
  interpretation: Interpretation;
}

export interface EmbeddingPoint {
  window_id: number;
  cluster_id: number;
  side: Side;
  period: number;
  start_s: number;
  x: number;
  y: number;
}

export interface PhaseAgreement {
  n_windows: number;
  nmi: number | null;
  ari: number | null;
  labels: string[];
  clusters: number[];
  counts: number[][];
}

export interface DiscoverySummary {
  match_id: number;
  method: string;
  window_s: number;
  step_s: number;
  n_windows: number;
  k: number;
  k_scores: Record<string, number>;
  pca_explained: number[];
  features: string[];
  clusters: ClusterSummary[];
  episodes: Episode[];
  embedding: EmbeddingPoint[];
  phase_agreement: PhaseAgreement | null;
  rules: { label: string; rule: string }[];
  demo_episode_id: number | null;
  runtime_s: number;
}

export interface FeatureChange {
  key: string;
  label: string;
  unit: string;
  start: number | null;
  end: number | null;
}

export interface EpisodeDetail {
  episode: Episode;
  cluster: ClusterSummary;
  changes: FeatureChange[];
  context_before_s: number;
  context_after_s: number;
}
