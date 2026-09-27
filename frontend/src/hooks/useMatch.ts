import { useAppState } from "@/app/providers/AppStateProvider";
import { fetchMatch, fetchMatches } from "@/services/matches";
import type { MatchDetail, Player } from "@/types/match";
import { useMemo } from "react";
import { useAsync } from "./useAsync";

export function useMatches() {
  return useAsync(fetchMatches, []);
}

export function useMatch() {
  const { matchId } = useAppState();
  return useAsync<MatchDetail>(matchId ? () => fetchMatch(matchId) : null, [matchId]);
}

export function usePlayerIndex(match: MatchDetail | null): Map<number, Player> {
  return useMemo(() => new Map((match?.players ?? []).map((p) => [p.id, p])), [match]);
}
