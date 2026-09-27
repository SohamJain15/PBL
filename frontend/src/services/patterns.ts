import type { AnalysisParams, DiscoverySummary, EpisodeDetail } from "@/types/patterns";
import { getCached, post, query } from "./api";

const paramQuery = (p: AnalysisParams) => query({ window: p.window_s, step: p.step_s, k: p.k });

export const fetchPatterns = (id: number, p: AnalysisParams) =>
  getCached<DiscoverySummary>(`/matches/${id}/patterns${paramQuery(p)}`);

export const fetchEpisode = (id: number, episodeId: number, p: AnalysisParams) =>
  getCached<EpisodeDetail>(`/matches/${id}/episodes/${episodeId}${paramQuery(p)}`);

export const runAnalysis = (id: number, p: AnalysisParams) =>
  post<DiscoverySummary>("/analyze", { match_id: id, ...p });
