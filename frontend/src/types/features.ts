import type { Side } from "./match";

export interface TeamShapeSeries {
  side: Side;
  t: number[];
  width: (number | null)[];
  depth: (number | null)[];
  area: (number | null)[];
  compactness: (number | null)[];
  stretch: (number | null)[];
  centroid: ([number, number] | null)[];
  hull: (number[] | null)[];
  near_ball_10: (number | null)[];
  near_ball_20: (number | null)[];
  density: (number | null)[];
}

export interface PlayerStat {
  player_id: number;
  distance_m: number;
  mean_speed: number | null;
  max_speed: number | null;
  max_accel: number | null;
  heading_deg: number | null;
  coverage: number;
  duration_s: number;
}

export interface RangeFeatures {
  match_id: number;
  period: number;
  start_s: number;
  end_s: number;
  hz: number;
  teams: TeamShapeSeries[];
  players: PlayerStat[];
}

export interface ShapeTimeline {
  match_id: number;
  period: number;
  bin_s: number;
  t: number[];
  home: Record<string, (number | null)[]>;
  away: Record<string, (number | null)[]>;
}

export interface Heatmap {
  match_id: number;
  side: Side | "all";
  period: number | null;
  start_s: number | null;
  end_s: number | null;
  bin_m: number;
  nx: number;
  ny: number;
  x_min: number;
  y_min: number;
  samples: number;
  grid: number[][];
  normalised_direction: boolean;
}

export interface TeamShapeValues {
  width: number | null;
  depth: number | null;
  area: number | null;
  compactness: number | null;
  stretch: number | null;
  near10: number | null;
  near20: number | null;
  density: number | null;
  centroid: [number, number] | null;
  hull: number[] | null;
}

export interface MetricSummary {
  mean: number | null;
  start: number | null;
  end: number | null;
}

export interface TeamWindowSummary {
  side: Side;
  valid_share: number;
  possession_share: number;
  metrics: Record<string, MetricSummary>;
}

export interface WindowSummary {
  match_id: number;
  period: number;
  start_s: number;
  end_s: number;
  teams: TeamWindowSummary[];
}
