import type { MatchDetail, MatchListItem } from "@/types/match";
import { getCached } from "./api";

export const fetchMatches = () => getCached<MatchListItem[]>("/matches");
export const fetchMatch = (id: number) => getCached<MatchDetail>(`/matches/${id}`);
