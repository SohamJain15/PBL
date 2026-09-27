/** Detection flag encoding shared with the backend. */
export const FLAG_MISSING = -1;
export const FLAG_EXTRAPOLATED = 0;
export const FLAG_DETECTED = 1;

export const POSSESSION_NONE = 0;
export const POSSESSION_HOME = 1;
export const POSSESSION_AWAY = 2;

export interface FrameChunk {
  match_id: number;
  period: number;
  start_s: number;
  end_s: number;
  fps: number;
  player_ids: number[];
  t: number[];
  frame: number[];
  xy: (number | null)[][];
  flag: number[][];
  ball: (number | null)[][];
  possession: number[];
  possession_player: (number | null)[];
}

/** A rendered instant: either an exact provider frame or an interpolation between two. */
export interface PlayerState {
  id: number;
  x: number;
  y: number;
  flag: number;
}

export interface SceneState {
  t: number;
  frame: number | null;
  exact: boolean;
  interpolated: boolean;
  players: PlayerState[];
  ball: { x: number; y: number; flag: number } | null;
  possession: number;
  carrier: number | null;
}
