import { memo, useMemo, useRef, useState } from "react";
import { usePlaybackSelector } from "@/app/providers/PlaybackProvider";
import type { Side } from "@/types/match";
import type { ClusterSummary, Episode } from "@/types/patterns";
import { clockShort } from "@/utils/formatting";
import { clusterCode, patternColor, patternShort } from "@/utils/patternStyle";

interface Props {
  start: number;
  end: number;
  episodes: Episode[]; // already filtered to the period
  clusters: ClusterSummary[];
  sideFilter: Side | "both";
  selectedEpisodeId: number | null;
  window: { start: number; end: number } | null;
  onSeek: (t: number) => void;
  onSelectEpisode: (id: number) => void;
  onSelectWindow: (w: { start: number; end: number } | null) => void;
}

const LABEL_W = 132;
const DRAG_THRESHOLD_PX = 4;

function Playhead({ start, end }: { start: number; end: number }) {
  const time = usePlaybackSelector((s) => s.time);
  const x = ((time - start) / (end - start)) * 100;
  return (
    <div className="pointer-events-none absolute inset-y-0 w-px bg-accent" style={{ left: `${Math.min(100, Math.max(0, x))}%` }}>
      <div className="absolute -left-[3px] -top-px h-0 w-0 border-x-[3.5px] border-t-[5px] border-x-transparent border-t-accent" />
    </div>
  );
}

const Lanes = memo(function Lanes({
  start, end, episodes, clusters, sideFilter, selectedEpisodeId, onSelectEpisode,
}: Pick<Props, "start" | "end" | "episodes" | "clusters" | "sideFilter" | "selectedEpisodeId" | "onSelectEpisode">) {
  const span = end - start;
  const ordered = useMemo(
    () => [...clusters].sort((a, b) => Number(!a.interpretation.label) - Number(!b.interpretation.label) || a.id - b.id),
    [clusters],
  );
  return (
    <div className="flex flex-col gap-[3px] py-1.5 [@media(max-height:780px)]:gap-px [@media(max-height:780px)]:py-1">
      {ordered.map((c) => {
        const eps = episodes.filter((e) => e.cluster_id === c.id && (sideFilter === "both" || e.side === sideFilter));
        const color = patternColor(c.interpretation.label, c.id);
        return (
          <div key={c.id} className="flex h-[9px] items-center [@media(max-height:780px)]:h-[7px]">
            <div className="flex shrink-0 items-center gap-1.5 pr-3 text-[10px] leading-none [@media(max-height:780px)]:text-[8px]" style={{ width: LABEL_W }}>
              <span className="font-mono text-ink-500">{clusterCode(c.id)}</span>
              <span className={c.interpretation.label ? "text-ink-300" : "text-ink-500"}>{patternShort(c.interpretation.label)}</span>
              <span className="ml-auto font-mono text-ink-500">{eps.length}</span>
            </div>
            <div className="relative h-full flex-1 bg-ink-850">
              {eps.map((e) => {
                const selected = e.id === selectedEpisodeId;
                return (
                  <button
                    key={e.id}
                    title={`${c.interpretation.label ?? "Unlabelled"} · ${clusterCode(c.id)} · ${e.side} · ${clockShort(e.start_s)}–${clockShort(e.end_s)}`}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onSelectEpisode(e.id);
                    }}
                    className="absolute inset-y-0 transition-opacity hover:opacity-100"
                    style={{
                      left: `${((e.start_s - start) / span) * 100}%`,
                      width: `max(2px, ${((e.end_s - e.start_s) / span) * 100}%)`,
                      background: color,
                      opacity: selected ? 1 : selectedEpisodeId === null ? 0.75 : 0.35,
                      outline: selected ? "1px solid #e6e7e4" : undefined,
                      zIndex: selected ? 2 : 1,
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export function PatternTimeline(props: Props) {
  const { start, end, window, onSeek, onSelectWindow } = props;
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ x0: number; t0: number; t1: number } | null>(null);
  const span = end - start;

  const timeAt = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return start;
    return start + Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * span;
  };

  const ticks = useMemo(() => {
    const out: number[] = [];
    const first = Math.ceil(start / 300) * 300;
    for (let t = first; t <= end; t += 300) out.push(t);
    return out;
  }, [start, end]);

  const band = drag && Math.abs(drag.t1 - drag.t0) > 0 ? { start: Math.min(drag.t0, drag.t1), end: Math.max(drag.t0, drag.t1) } : window;

  return (
    <div className="px-4 pb-2">
      <div className="flex">
        <div style={{ width: LABEL_W }} className="shrink-0 pt-1">
          <span className="label">Timeline</span>
        </div>
        <div className="relative flex-1">
          <div className="relative h-4">
            {ticks.map((t) => (
              <span
                key={t}
                className="absolute top-0 -translate-x-1/2 font-mono text-[9px] text-ink-500"
                style={{ left: `${((t - start) / span) * 100}%` }}
              >
                {Math.round(t / 60)}′
              </span>
            ))}
          </div>
          <div
            ref={trackRef}
            className="relative h-5 cursor-crosshair border-y border-ink-700 bg-ink-850"
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              const t = timeAt(e.clientX);
              setDrag({ x0: e.clientX, t0: t, t1: t });
            }}
            onPointerMove={(e) => drag && setDrag({ ...drag, t1: timeAt(e.clientX) })}
            onPointerUp={(e) => {
              if (!drag) return;
              if (Math.abs(e.clientX - drag.x0) < DRAG_THRESHOLD_PX) onSeek(drag.t0);
              else onSelectWindow({ start: Math.min(drag.t0, drag.t1), end: Math.max(drag.t0, drag.t1) });
              setDrag(null);
            }}
          >
            {ticks.map((t) => (
              <span key={t} className="absolute inset-y-0 w-px bg-ink-700" style={{ left: `${((t - start) / span) * 100}%` }} />
            ))}
            {band && (
              <div
                className="absolute inset-y-0 border-x border-ink-300 bg-ink-100/10"
                style={{ left: `${((band.start - start) / span) * 100}%`, width: `${((band.end - band.start) / span) * 100}%` }}
              />
            )}
            <Playhead start={start} end={end} />
          </div>
        </div>
      </div>
      <div className="relative">
        <Lanes {...props} />
        <div className="pointer-events-none absolute inset-y-0 right-0" style={{ left: LABEL_W }}>
          <Playhead start={start} end={end} />
        </div>
      </div>
    </div>
  );
}
