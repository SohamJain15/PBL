import { useEffect } from "react";
import { useAppState } from "@/app/providers/AppStateProvider";
import { usePlaybackSelector, usePlaybackStore } from "@/app/providers/PlaybackProvider";
import { PatternTimeline } from "@/components/timeline/PatternTimeline";
import { FootballPitch } from "@/components/pitch/FootballPitch";
import { PitchSvg } from "@/components/pitch/PitchOverlay";
import { Centered, ErrorNote, Loading } from "@/components/common/Status";
import { AnalysisPanel } from "@/features/analysis/AnalysisPanel";
import { MatchBar } from "@/features/match/MatchBar";
import { PatternDetailPanel } from "@/features/patterns/PatternDetailPanel";
import { MetricStrip } from "@/features/tracking/MetricStrip";
import { OverlayToolbar } from "@/features/tracking/OverlayToolbar";
import { TrackingScene } from "@/features/tracking/TrackingScene";
import { TransportBar } from "@/features/tracking/TransportBar";
import { useMatch, usePlayerIndex } from "@/hooks/useMatch";
import { useEpisode, usePatterns } from "@/hooks/usePatterns";
import { useKeyboardTransport, usePeriodBounds } from "@/hooks/usePlayback";
import { chunkStartFor, useTrackingChunks } from "@/hooks/useTracking";
import type { MatchDetail } from "@/types/match";
import { CHUNK_S, PREFETCH_BEFORE_END_S } from "@/utils/constants";

function Legend() {
  return (
    <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.08em] text-ink-400">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-200" /> Detected
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full border border-dashed border-ink-200 bg-ink-200/30" /> Extrapolated
      </span>
    </div>
  );
}

function Workspace({ match }: { match: MatchDetail }) {
  const store = usePlaybackStore();
  const { period, setPeriod, episodeId, selectEpisode, demo, window, setWindow, setOverlays } = useAppState();
  const players = usePlayerIndex(match);
  const patterns = usePatterns(match.tracking_available);
  const episode = useEpisode();
  // Re-render the workspace only when the chunk changes or the prefetch point is crossed.
  const chunkTime = usePlaybackSelector((s) => {
    const start = chunkStartFor(s.time);
    const prefetchAt = start + CHUNK_S - PREFETCH_BEFORE_END_S;
    return s.time > prefetchAt ? prefetchAt + 0.5 : start;
  });
  const { current, previous, error } = useTrackingChunks(match, period, chunkTime);

  usePeriodBounds(match, period);
  useKeyboardTransport(match.fps);

  // Tactical replay: jump to BEFORE → DURING → AFTER of the selected episode and play it.
  const detail = episode.data;
  useEffect(() => {
    if (!detail) return;
    const ep = detail.episode;
    if (ep.period !== period) {
      setPeriod(ep.period);
      return;
    }
    const p = match.periods.find((x) => x.period === ep.period);
    if (!p) return;
    store.setBounds({ start: p.start_s, end: p.end_s });
    const loop = {
      start: Math.max(p.start_s, ep.start_s - detail.context_before_s),
      end: Math.min(p.end_s, ep.end_s + detail.context_after_s),
    };
    setOverlays({ shapeSide: ep.side });
    store.pause();
    store.setLoop(loop);
    store.seek(loop.start);
    store.play();
  }, [detail, period, match, store, setPeriod, setOverlays]);

  const periodInfo = match.periods.find((p) => p.period === period);
  const periodEpisodes = (patterns.data?.episodes ?? []).filter((e) => e.period === period);
  const focusSide = detail ? detail.episode.side : null;

  return (
    <div className="flex h-full flex-col">
      <MatchBar
        match={match}
        demoAvailable={patterns.data?.demo_episode_id != null}
        onDemo={() => patterns.data?.demo_episode_id != null && selectEpisode(patterns.data.demo_episode_id, { demo: true })}
      />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-10 items-center justify-between border-b border-ink-700 px-4">
            <OverlayToolbar />
            <Legend />
          </div>
          <div className="relative min-h-0 flex-1 bg-[#1f3a27] p-3">
            {error && (
              <div className="absolute left-4 top-4 z-10">
                <ErrorNote error={error} />
              </div>
            )}
            {!current && (
              <div className="absolute inset-0 z-10">
                <Centered>
                  <Loading label="Loading tracking" />
                </Centered>
              </div>
            )}
            {detail && (
              <div className="pointer-events-none absolute left-4 top-4 z-10 border border-ink-700 bg-ink-950/80 px-2.5 py-1.5">
                <div className={`label ${demo ? "text-accent" : "text-ink-200"}`}>{demo ? "Demo sequence" : "Tactical replay"}</div>
                <div className="font-mono text-[10px] text-ink-300">SkillCorner tracking · episode #{detail.episode.id}</div>
              </div>
            )}
            <PitchSvg length={match.pitch_length} width={match.pitch_width} onBackgroundClick={() => undefined}>
              <FootballPitch length={match.pitch_length} width={match.pitch_width} />
              <TrackingScene current={current} previous={previous} players={players} focusSide={focusSide} />
            </PitchSvg>
          </div>
          <MetricStrip match={match} features={current?.features ?? null} />
        </div>
        <aside className="scroll-thin w-[340px] shrink-0 overflow-y-auto border-l border-ink-700 bg-ink-900">
          {detail && (
            <PatternDetailPanel
              detail={detail}
              match={match}
              demo={demo}
              onClose={() => {
                selectEpisode(null);
                store.setLoop(null);
              }}
            />
          )}
          <AnalysisPanel match={match} chunk={current} players={players} period={period} />
        </aside>
      </div>
      <div className="shrink-0 border-t border-ink-700 bg-ink-900">
        <TransportBar match={match} frames={current?.frames ?? null} />
        {periodInfo && (
          <div className="relative">
            <PatternTimeline
              start={periodInfo.start_s}
              end={periodInfo.end_s}
              episodes={periodEpisodes}
              clusters={patterns.data?.clusters ?? []}
              sideFilter="both"
              selectedEpisodeId={episodeId}
              window={window && window.period === period ? window : null}
              onSeek={(t) => {
                if (episodeId !== null) selectEpisode(null);
                store.setLoop(null);
                store.seek(t);
              }}
              onSelectEpisode={(id) => selectEpisode(id)}
              onSelectWindow={(w) => setWindow(w ? { period, ...w } : null)}
            />
            {patterns.loading && (
              <div className="absolute inset-x-0 bottom-2 flex justify-center">
                <Loading label="Analyzing" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function MatchPage() {
  const match = useMatch();
  if (match.error) return <Centered><ErrorNote error={match.error} /></Centered>;
  if (!match.data) return <Centered><Loading /></Centered>;
  if (!match.data.tracking_available) {
    return (
      <Centered>
        <div className="max-w-md text-center">
          <div className="label mb-2 text-ink-200">Tracking not downloaded</div>
          <code className="block border border-ink-700 bg-ink-900 px-3 py-2 font-mono text-[12px] text-ink-200">
            python scripts/download_data.py --match {match.data.id}
          </code>
        </div>
      </Centered>
    );
  }
  return <Workspace match={match.data} />;
}
