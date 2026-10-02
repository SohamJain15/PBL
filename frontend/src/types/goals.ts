import type { Side } from "./match";

export interface GoalEvent {
  id: number;
  period: number;
  time_s: number;
  clock: string;
  frame: number;
  scoring_side: Side;
  scoring_team: string;
  conceding_side: Side;
  conceding_team: string;
  home_score: number;
  away_score: number;
  player_name: string | null;
}

export interface GoalFactor {
  key: string;
  label: string;
  unit: string;
  value: number | null;
  baseline: number | null;
  z_score: number | null;
  direction: string;
  explanation: string;
}

export interface GoalAnalysis {
  goal: GoalEvent;
  window_start_s: number;
  window_end_s: number;
  replay_start_s: number;
  replay_end_s: number;
  tracking_gap_s: number | null;
  conceding_factors: GoalFactor[];
  attacking_factors: GoalFactor[];
  pattern_cluster: number | null;
  pattern_label: string | null;
  phase: string | null;
}