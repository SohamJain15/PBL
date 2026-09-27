import { Play, X } from "lucide-react";
import { usePlaybackStore } from "@/app/providers/PlaybackProvider";
import { useAppState } from "@/app/providers/AppStateProvider";
import { CompareRow } from "@/components/analysis/MetricRow";
import { QualityBar } from "@/components/analysis/QualityBar";
import { InfoTip } from "@/components/common/InfoTip";
import { Section } from "@/components/common/Section";
import { Empty } from "@/components/common/Status";
import { useAsync } from "@/hooks/useAsync";
import { useFrameTime } from "@/hooks/usePlayback";
import type { Chunk } from "@/hooks/useTracking";
import { fetchQuality, fetchWindowSummary } from "@/services/tracking";
import type { MatchDetail, Player } from "@/types/match";
import { clockShort, num, pct, signed } from "@/utils/formatting";
import { TEAM_COLORS } from "@/utils/patternStyle";
import { COMPACTNESS_DEF } from "../tracking/MetricStrip";
import { shapeAt } from "../tracking/shapeAt";

const DENSITY_DEF = "All players (both teams) within 10 m of the ball, per 100 m² of that disc.";

function TeamHeader({ match }: { match: MatchDetail }) {
  return (
    <div className="grid grid-cols-[1fr_64px_64px] pb-1">
      <span />
      {(["home", "away"] as const).map((s) => (
        <span key={s} className="flex items-center justify-end gap-1.5 text-[10px] font-medium tracking-[0.1em] text-ink-300">
          <span className="h-1.5 w-1.5" style={{ background: TEAM_COLORS[s] }} />
          {match[s].acronym}
        </span>
      ))}
    </div>
  );
}

function LiveShape({ match, chunk }: { match: MatchDetail; chunk: Chunk | null }) {
  const t = useFrameTime(match.fps);
  const h = shapeAt(chunk?.features ?? null, "home", t);
  const a = shapeAt(chunk?.features ?? null, "away", t);
  return (
    <Section title="Team shape" right={<span className="font-mono text-[10px] text-ink-500">{clockShort(t)} · frame</span>}>
      <TeamHeader match={match} />
      <CompareRow label="Width" home={num(h?.width)} away={num(a?.width)} unit="m" />
      <CompareRow label="Depth" home={num(h?.depth)} away={num(a?.depth)} unit="m" />
      <CompareRow label="Area" home={num(h?.area, 0)} away={num(a?.area, 0)} unit="m²" info={<InfoTip>Convex hull of outfield players (goalkeepers excluded).</InfoTip>} />
      <CompareRow label="Compactness" home={num(h?.compactness, 2)} away={num(a?.compactness, 2)} info={<InfoTip>{COMPACTNESS_DEF}</InfoTip>} />
      <CompareRow label="Stretch index" home={num(h?.stretch)} away={num(a?.stretch)} unit="m" />
      <CompareRow label="≤10 m of ball" home={num(h?.near10, 0)} away={num(a?.near10, 0)} />
      <CompareRow label="≤20 m of ball" home={num(h?.near20, 0)} away={num(a?.near20, 0)} />
      <CompareRow label="Ball-area density" home={num(h?.density, 2)} away={num(a?.density, 2)} info={<InfoTip>{DENSITY_DEF}</InfoTip>} />
    </Section>
  );
}

function WindowShape({ match }: { match: MatchDetail }) {
  const { window, setWindow, selectEpisode } = useAppState();
  const store = usePlaybackStore();
  const { data } = useAsync(
    window ? () => fetchWindowSummary(match.id, window.period, window.start, window.end) : null,
    [match.id, window?.period, window?.start, window?.end],
  );
  if (!window) return null;
  const team = (s: "home" | "away") => data?.teams.find((t) => t.side === s);
  const h = team("home");
  const a = team("away");
  const delta = (side: typeof h, key: string, d = 1) => {
    const m = side?.metrics[key];
    return m && m.start !== null && m.end !== null ? signed(m.end - m.start, d) : "—";
  };
  const mean = (side: typeof h, key: string, d = 1) => num(side?.metrics[key]?.mean, d);
  return (
    <Section
      title={`Window ${clockShort(window.start)}–${clockShort(window.end)}`}
      right={
        <span className="-mr-2 flex items-center">
          <button
            className="icon-btn h-5 w-5 hover:text-accent"
            title="Play this window"
            onClick={() => {
              selectEpisode(null);
              store.setLoop({ start: window.start, end: window.end });
              store.seek(window.start);
              store.play();
            }}
          >
            <Play size={11} />
          </button>
          <button className="icon-btn h-5 w-5" onClick={() => setWindow(null)} aria-label="Clear window">
            <X size={12} />
          </button>
        </span>
      }
      className="fade-in"
    >
      <TeamHeader match={match} />
      <CompareRow label="Width (mean)" home={mean(h, "width")} away={mean(a, "width")} unit="m" />
      <CompareRow label="Width Δ" home={delta(h, "width")} away={delta(a, "width")} unit="m" />
      <CompareRow label="Area (mean)" home={mean(h, "area", 0)} away={mean(a, "area", 0)} unit="m²" />
      <CompareRow label="Area Δ" home={delta(h, "area", 0)} away={delta(a, "area", 0)} unit="m²" />
      <CompareRow label="Compactness" home={mean(h, "compactness", 2)} away={mean(a, "compactness", 2)} />
      <CompareRow label="Density" home={mean(h, "density", 2)} away={mean(a, "density", 2)} />
      <CompareRow label="In possession" home={h ? pct(h.possession_share) : "—"} away={a ? pct(a.possession_share) : "—"} />
      <CompareRow label="Valid samples" home={h ? pct(h.valid_share) : "—"} away={a ? pct(a.valid_share) : "—"} />
    </Section>
  );
}

function Quality({ match, chunk, period }: { match: MatchDetail; chunk: Chunk | null; period: number }) {
  const range = chunk ? [chunk.start, chunk.end] : null;
  const { data } = useAsync(
    range ? () => fetchQuality(match.id, period, range[0], range[1]) : null,
    [match.id, period, range?.[0], range?.[1]],
  );
  return (
    <Section
      title="Tracking quality"
      right={range && <span className="font-mono text-[10px] text-ink-500">{clockShort(range[0])}–{clockShort(range[1])}</span>}
    >
      {data ? <QualityBar q={data} /> : <Empty />}
    </Section>
  );
}

function SelectedPlayer({ chunk, players }: { chunk: Chunk | null; players: Map<number, Player> }) {
  const { playerId, selectPlayer } = useAppState();
  if (playerId === null) {
    return (
      <Section title="Player">
        <div className="text-[11px] text-ink-500">Click a player on the pitch</div>
      </Section>
    );
  }
  const p = players.get(playerId);
  const s = chunk?.features.players.find((x) => x.player_id === playerId);
  const side = p?.side === "home" || p?.side === "away" ? p.side : null;
  return (
    <Section
      title="Player"
      right={
        <button className="icon-btn -mr-2 h-5 w-5" onClick={() => selectPlayer(null)} aria-label="Clear player">
          <X size={12} />
        </button>
      }
    >
      <div className="mb-2 flex items-center gap-2">
        {side && <span className="h-2 w-2" style={{ background: TEAM_COLORS[side] }} />}
        <span className="value text-[13px]">{p?.number ?? "—"}</span>
        <span className="text-[13px]">{p?.short_name ?? playerId}</span>
        <span className="ml-auto font-mono text-[10px] text-ink-400">{p?.role}</span>
      </div>
      {s ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <Kv k="Distance" v={`${num(s.distance_m, 0)} m`} />
          <Kv k="Mean speed" v={`${num(s.mean_speed, 2)} m/s`} />
          <Kv k="Max speed" v={`${num(s.max_speed, 2)} m/s`} />
          <Kv k="Max |accel|" v={`${num(s.max_accel, 1)} m/s²`} />
          <Kv k="Heading" v={s.heading_deg === null ? "—" : `${s.heading_deg.toFixed(0)}°`} />
          <Kv k="Coverage" v={pct(s.coverage)} />
        </div>
      ) : (
        <Empty label="Not on pitch in this chunk" />
      )}
      <div className="mt-2 text-[10px] text-ink-500">
        Over the loaded {chunk ? `${clockShort(chunk.start)}–${clockShort(chunk.end)}` : ""} chunk · 5-frame smoothing
      </div>
    </Section>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[11px] text-ink-400">{k}</span>
      <span className="value text-[12px]">{v}</span>
    </div>
  );
}

export function AnalysisPanel({
  match, chunk, players, period,
}: { match: MatchDetail; chunk: Chunk | null; players: Map<number, Player>; period: number }) {
  return (
    <>
      <WindowShape match={match} />
      <LiveShape match={match} chunk={chunk} />
      <SelectedPlayer chunk={chunk} players={players} />
      <Quality match={match} chunk={chunk} period={period} />
    </>
  );
}
