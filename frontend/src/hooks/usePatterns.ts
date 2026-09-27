import { useAppState } from "@/app/providers/AppStateProvider";
import { fetchEpisode, fetchPatterns } from "@/services/patterns";
import type { DiscoverySummary, EpisodeDetail } from "@/types/patterns";
import { useAsync } from "./useAsync";

export function usePatterns(enabled = true) {
  const { matchId, analysis } = useAppState();
  return useAsync<DiscoverySummary>(
    enabled && matchId ? () => fetchPatterns(matchId, analysis) : null,
    [enabled, matchId, analysis.window_s, analysis.step_s, analysis.k],
  );
}

export function useEpisode() {
  const { matchId, analysis, episodeId } = useAppState();
  return useAsync<EpisodeDetail>(
    matchId !== null && episodeId !== null ? () => fetchEpisode(matchId, episodeId, analysis) : null,
    [matchId, episodeId, analysis.window_s, analysis.step_s, analysis.k],
  );
}
