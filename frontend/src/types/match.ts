export type Side = "home" | "away";

export interface Team {
  id: number;
  name: string;
  short_name: string;
  acronym: string;
  side: Side;
  color: string;
  number_color: string;
}

export interface Player {
  id: number;
  team_id: number;
  side: Side | "unknown";
  number: number | null;
  short_name: string;
  role: string;
  is_goalkeeper: boolean;
}

export interface Period {
  period: number;
  start_s: number;
  end_s: number;
  home_direction: 1 | -1;
}

export interface MatchListItem {
  id: number;
  date_time: string;
  home_team: string;
  away_team: string;
  metadata_available: boolean;
  tracking_available: boolean;
}

export interface Quality {
  frames: number;
  frames_with_players: number;
  detected: number;
  extrapolated: number;
  missing: number;
  ball_detected: number;
  ball_extrapolated: number;
  ball_missing: number;
}

export interface MatchDetail {
  id: number;
  sport: string;
  competition: string;
  season: string;
  round_name: string | null;
  date_time: string;
  stadium: string | null;
  home_score: number | null;
  away_score: number | null;
  home: Team;
  away: Team;
  pitch_length: number;
  pitch_width: number;
  fps: number;
  periods: Period[];
  players: Player[];
  tracking_available: boolean;
  quality: Quality | null;
}
