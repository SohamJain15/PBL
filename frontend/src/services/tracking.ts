import type { Heatmap, RangeFeatures, ShapeTimeline, WindowSummary } from "@/types/features";
import type { Quality } from "@/types/match";
import type { FrameChunk } from "@/types/tracking";
import { getCached, query } from "./api";

export const fetchFrames = (id: number, period: number, start: number, end: number) =>
  getCached<FrameChunk>(`/matches/${id}/frames${query({ period, start, end })}`);

export const fetchRangeFeatures = (id: number, period: number, start: number, end: number) =>
  getCached<RangeFeatures>(`/matches/${id}/features${query({ period, start, end })}`);

export const fetchQuality = (id: number, period: number, start: number, end: number) =>
  getCached<Quality>(`/matches/${id}/quality${query({ period, start, end })}`);

export const fetchShapeTimeline = (id: number, period: number, bin: number) =>
  getCached<ShapeTimeline>(`/matches/${id}/shape-timeline${query({ period, bin })}`);

export const fetchHeatmap = (
  id: number,
  side: string,
  period: number | null,
  start: number | null,
  end: number | null,
) => getCached<Heatmap>(`/matches/${id}/heatmap${query({ side, period, start, end })}`);

export const fetchWindowSummary = (id: number, period: number, start: number, end: number) =>
  getCached<WindowSummary>(`/matches/${id}/window-summary${query({ period, start, end })}`);
