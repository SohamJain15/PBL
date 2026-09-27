import { useEffect, useState } from "react";
import { usePlaybackStore } from "@/app/providers/PlaybackProvider";
import { fetchFrames, fetchRangeFeatures } from "@/services/tracking";
import type { RangeFeatures } from "@/types/features";
import type { MatchDetail } from "@/types/match";
import type { FrameChunk } from "@/types/tracking";
import { CHUNK_S, PREFETCH_BEFORE_END_S } from "@/utils/constants";

export interface Chunk {
  key: string;
  start: number;
  end: number;
  frames: FrameChunk;
  features: RangeFeatures;
}

const OVERLAP_S = 0.2; // include the first frame of the next chunk for interpolation

function chunkRange(match: MatchDetail, period: number, start: number): [number, number] {
  const p = match.periods.find((x) => x.period === period);
  const end = Math.min(start + CHUNK_S + OVERLAP_S, p ? p.end_s : start + CHUNK_S);
  return [start, end];
}

async function loadChunk(match: MatchDetail, period: number, start: number): Promise<Chunk> {
  const [s, e] = chunkRange(match, period, start);
  const [frames, features] = await Promise.all([
    fetchFrames(match.id, period, s, e),
    fetchRangeFeatures(match.id, period, s, e),
  ]);
  return { key: `${match.id}:${period}:${start}`, start: s, end: e, frames, features };
}

export const chunkStartFor = (time: number) => Math.floor(time / CHUNK_S) * CHUNK_S;

/**
 * Loads the time-windowed chunk that contains ``time`` (plus the previous chunk, for trails)
 * and prefetches the next one. Only ever holds ~3 chunks; never the full match.
 */
export function useTrackingChunks(match: MatchDetail | null, period: number, time: number) {
  const store = usePlaybackStore();
  const start = chunkStartFor(time);
  const [current, setCurrent] = useState<Chunk | null>(null);
  const [previous, setPrevious] = useState<Chunk | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const periodInfo = match?.periods.find((x) => x.period === period);
  const inPeriod = periodInfo !== undefined && start + CHUNK_S > periodInfo.start_s && start <= periodInfo.end_s;

  useEffect(() => {
    if (!match?.tracking_available || !inPeriod) return;
    let alive = true;
    store.setBuffering(true);
    loadChunk(match, period, start)
      .then((c) => {
        if (!alive) return;
        setCurrent(c);
        setError(null);
        store.setBuffering(false);
      })
      .catch((e: Error) => alive && setError(e));
    const p = match.periods.find((x) => x.period === period);
    if (p && start > p.start_s) {
      loadChunk(match, period, start - CHUNK_S)
        .then((c) => alive && setPrevious(c))
        .catch(() => alive && setPrevious(null));
    }
    return () => {
      alive = false;
    };
  }, [match, period, start, store, inPeriod]);

  // prefetch the next chunk shortly before it is needed
  const needNext = time > start + CHUNK_S - PREFETCH_BEFORE_END_S;
  useEffect(() => {
    if (!match?.tracking_available || !needNext) return;
    const p = match.periods.find((x) => x.period === period);
    if (p && start + CHUNK_S < p.end_s) void loadChunk(match, period, start + CHUNK_S).catch(() => undefined);
  }, [match, period, start, needNext]);

  // Keep showing the last chunk while the next one loads (the scene holds its final frame).
  const ready = current !== null && current.key === `${match?.id}:${period}:${start}`;
  const sameMatch = current !== null && current.key.startsWith(`${match?.id}:${period}:`);
  return { current: sameMatch ? current : null, previous, error, ready };
}
