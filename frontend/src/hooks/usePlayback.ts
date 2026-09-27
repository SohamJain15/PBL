import { useEffect } from "react";
import { usePlaybackSelector, usePlaybackStore } from "@/app/providers/PlaybackProvider";
import type { MatchDetail } from "@/types/match";

/** Keeps playback bounds aligned with the selected period. */
export function usePeriodBounds(match: MatchDetail | null, period: number) {
  const store = usePlaybackStore();
  useEffect(() => {
    const p = match?.periods.find((x) => x.period === period);
    if (!p) return;
    store.pause();
    store.setLoop(null);
    store.setBounds({ start: p.start_s, end: p.end_s });
    store.seek(p.start_s);
  }, [match, period, store]);
}

/** Current time quantised to provider frames (re-renders at ≤ fps, not at 60 Hz). */
export function useFrameTime(fps: number): number {
  return usePlaybackSelector((s) => Math.floor(s.time * fps + 1e-6) / fps);
}

export function useKeyboardTransport(fps: number) {
  const store = usePlaybackStore();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        store.toggle();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        store.step(e.shiftKey ? fps : 1, fps);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        store.step(e.shiftKey ? -fps : -1, fps);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store, fps]);
}
