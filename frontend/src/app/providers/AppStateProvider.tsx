import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Side } from "@/types/match";
import type { AnalysisParams } from "@/types/patterns";
import { DEFAULT_ANALYSIS } from "@/utils/constants";

export type TrailScope = "all" | "home" | "away" | "selected";

export interface Overlays {
  hull: boolean;
  centroid: boolean;
  trails: boolean;
  trailSeconds: number;
  trailScope: TrailScope;
  interpolate: boolean;
  shapeSide: Side;
}

export interface TimeWindow {
  period: number;
  start: number;
  end: number;
}

interface AppState {
  matchId: number | null;
  period: number;
  analysis: AnalysisParams;
  episodeId: number | null;
  playerId: number | null;
  overlays: Overlays;
  window: TimeWindow | null;
  demo: boolean;
}

interface AppActions {
  setMatch: (id: number) => void;
  setPeriod: (p: number) => void;
  setAnalysis: (p: AnalysisParams) => void;
  selectEpisode: (id: number | null, opts?: { demo?: boolean }) => void;
  selectPlayer: (id: number | null) => void;
  setOverlays: (patch: Partial<Overlays>) => void;
  setWindow: (w: TimeWindow | null) => void;
}

const Ctx = createContext<(AppState & AppActions) | null>(null);

const INITIAL_OVERLAYS: Overlays = {
  hull: true,
  centroid: true,
  trails: false,
  trailSeconds: 5,
  trailScope: "selected",
  interpolate: true,
  shapeSide: "home",
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    matchId: null,
    period: 1,
    analysis: { ...DEFAULT_ANALYSIS },
    episodeId: null,
    playerId: null,
    overlays: INITIAL_OVERLAYS,
    window: null,
    demo: false,
  });

  const setMatch = useCallback(
    (id: number) =>
      setState((s) => (s.matchId === id ? s : { ...s, matchId: id, period: 1, episodeId: null, playerId: null, window: null, demo: false })),
    [],
  );
  const setPeriod = useCallback((period: number) => setState((s) => ({ ...s, period })), []);
  const setAnalysis = useCallback(
    (analysis: AnalysisParams) => setState((s) => ({ ...s, analysis, episodeId: null, demo: false })),
    [],
  );
  const selectEpisode = useCallback(
    (episodeId: number | null, opts?: { demo?: boolean }) =>
      setState((s) => ({ ...s, episodeId, demo: Boolean(opts?.demo) && episodeId !== null })),
    [],
  );
  const selectPlayer = useCallback((playerId: number | null) => setState((s) => ({ ...s, playerId })), []);
  const setOverlays = useCallback(
    (patch: Partial<Overlays>) => setState((s) => ({ ...s, overlays: { ...s.overlays, ...patch } })),
    [],
  );
  const setWindow = useCallback((window: TimeWindow | null) => setState((s) => ({ ...s, window })), []);

  const value = useMemo(
    () => ({ ...state, setMatch, setPeriod, setAnalysis, selectEpisode, selectPlayer, setOverlays, setWindow }),
    [state, setMatch, setPeriod, setAnalysis, selectEpisode, selectPlayer, setOverlays, setWindow],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AppStateProvider missing");
  return v;
}
