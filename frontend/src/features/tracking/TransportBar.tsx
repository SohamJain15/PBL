import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { usePlaybackSelector, usePlaybackStore } from "@/app/providers/PlaybackProvider";
import { useAppState } from "@/app/providers/AppStateProvider";
import { Segmented } from "@/components/common/Segmented";
import { useFrameTime } from "@/hooks/usePlayback";
import type { FrameChunk } from "@/types/tracking";
import { POSSESSION_AWAY, POSSESSION_HOME } from "@/types/tracking";
import type { MatchDetail } from "@/types/match";
import { PLAYBACK_SPEEDS } from "@/utils/constants";
import { clock } from "@/utils/formatting";
import { frameIndexAt } from "@/utils/interpolation";
import { TEAM_COLORS } from "@/utils/patternStyle";

function Clock({ frames, fps }: { frames: FrameChunk | null; fps: number }) {
  const time = usePlaybackSelector((s) => Math.round(s.time * 10) / 10);
  const playing = usePlaybackSelector((s) => s.playing);
  const buffering = usePlaybackSelector((s) => s.buffering);
  const { overlays } = useAppState();
  const t = useFrameTime(fps);
  const i = frames ? frameIndexAt(frames.t, t + 1e-6) : -1;
  const frame = i >= 0 && frames ? frames.frame[i] : null;
  const raw = !playing || !overlays.interpolate;
  return (
    <div className="flex items-baseline gap-3">
      <span className="value text-[15px] font-medium">{clock(time)}</span>
      <span className="font-mono text-[10px] text-ink-500">FRAME {frame ?? "—"}</span>
      <span className={`text-[10px] font-medium uppercase tracking-[0.1em] ${raw ? "text-ink-400" : "text-ink-500"}`}>
        {buffering ? "LOADING" : raw ? "RAW" : "INTERPOLATED"}
      </span>
    </div>
  );
}

function Possession({ frames, match }: { frames: FrameChunk | null; match: MatchDetail }) {
  const t = useFrameTime(match.fps);
  const i = frames ? frameIndexAt(frames.t, t + 1e-6) : -1;
  const code = i >= 0 && frames ? frames.possession[i] : 0;
  const carrierId = i >= 0 && frames ? frames.possession_player[i] : null;
  const carrier = carrierId !== null ? match.players.find((p) => p.id === carrierId) : undefined;
  const side = code === POSSESSION_HOME ? "home" : code === POSSESSION_AWAY ? "away" : null;
  return (
    <div className="flex items-center gap-2">
      <span className="label">Possession</span>
      <span className="h-2.5 w-2.5" style={{ background: side ? TEAM_COLORS[side] : "transparent", border: side ? "none" : "1px solid #4a5058" }} />
      <span className="value text-[12px]">{side ? match[side].acronym : "—"}</span>
      <span className="w-32 truncate text-[11px] text-ink-400">
        {carrier ? `${carrier.number ?? ""} ${carrier.short_name}` : ""}
      </span>
    </div>
  );
}

export function TransportBar({ match, frames }: { match: MatchDetail; frames: FrameChunk | null }) {
  const store = usePlaybackStore();
  const playing = usePlaybackSelector((s) => s.playing);
  const speed = usePlaybackSelector((s) => s.speed);
  return (
    <div className="flex h-11 items-center gap-4 px-4">
      <div className="flex items-center">
        <button className="icon-btn" onClick={() => store.step(-1, match.fps)} title="Previous frame (←)">
          <SkipBack size={14} />
        </button>
        <button
          className="mx-1 inline-flex h-8 w-8 items-center justify-center border border-ink-500 text-ink-100 hover:border-accent hover:text-accent"
          onClick={() => store.toggle()}
          title="Play / pause (space)"
        >
          {playing ? <Pause size={14} /> : <Play size={14} className="translate-x-px" />}
        </button>
        <button className="icon-btn" onClick={() => store.step(1, match.fps)} title="Next frame (→)">
          <SkipForward size={14} />
        </button>
      </div>
      <Segmented<number>
        size="xs"
        value={speed}
        onChange={(v) => store.setSpeed(v)}
        options={PLAYBACK_SPEEDS.map((s) => ({ value: s, label: `${s}×` }))}
      />
      <Clock frames={frames} fps={match.fps} />
      <div className="ml-auto">
        <Possession frames={frames} match={match} />
      </div>
    </div>
  );
}
