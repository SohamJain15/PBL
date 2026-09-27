import { memo, useMemo } from "react";
import { useAppState } from "@/app/providers/AppStateProvider";
import { usePlaybackSelector } from "@/app/providers/PlaybackProvider";
import { BallMarker } from "@/components/pitch/BallMarker";
import { CentroidMarker } from "@/components/pitch/PitchOverlay";
import { PlayerMarker } from "@/components/pitch/PlayerMarker";
import { TeamHull } from "@/components/pitch/TeamHull";
import { Trajectory } from "@/components/pitch/Trajectory";
import type { Chunk } from "@/hooks/useTracking";
import type { Player, Side } from "@/types/match";
import { sceneAt, trailOf } from "@/utils/interpolation";
import { TEAM_COLORS } from "@/utils/patternStyle";
import { shapeAt } from "./shapeAt";

interface Props {
  current: Chunk | null;
  previous: Chunk | null;
  players: Map<number, Player>;
  focusSide: Side | null; // side emphasised during a tactical replay
}

const SIDES: Side[] = ["home", "away"];

/** Dynamic pitch layer. Re-renders every animation frame; the static pitch does not. */
export const TrackingScene = memo(function TrackingScene({ current, previous, players, focusSide }: Props) {
  const time = usePlaybackSelector((s) => s.time);
  const { overlays, playerId, selectPlayer } = useAppState();

  const scene = useMemo(
    () => (current ? sceneAt(current.frames, time, overlays.interpolate) : null),
    [current, time, overlays.interpolate],
  );
  if (!scene || !current) return null;

  const colorOf = (id: number) => {
    const side = players.get(id)?.side;
    return side === "home" || side === "away" ? TEAM_COLORS[side] : "#9399a2";
  };

  const trailIds = !overlays.trails
    ? []
    : scene.players
        .map((p) => p.id)
        .filter((id) => {
          const side = players.get(id)?.side;
          if (overlays.trailScope === "all") return true;
          if (overlays.trailScope === "selected") return id === playerId;
          return side === overlays.trailScope;
        });

  const from = time - overlays.trailSeconds;
  const trails = trailIds.map((id) => {
    const older = previous && previous.start < current.start ? trailOf(previous.frames, id, from, current.start - 1e-3) : [];
    const recent = trailOf(current.frames, id, Math.max(from, current.start), time);
    const now = scene.players.find((p) => p.id === id);
    return { id, pts: now ? [...older, ...recent, now.x, now.y] : [...older, ...recent] };
  });

  return (
    <g>
      {SIDES.map((side) => {
        const shape = shapeAt(current.features, side, time);
        const emphasis = focusSide === null || focusSide === side;
        return (
          <g key={side} opacity={emphasis ? 1 : 0.55}>
            {overlays.hull && shape?.hull && <TeamHull hull={shape.hull} color={TEAM_COLORS[side]} emphasis={focusSide === side} />}
            {overlays.centroid && shape?.centroid && (
              <CentroidMarker x={shape.centroid[0]} y={shape.centroid[1]} color={TEAM_COLORS[side]} />
            )}
          </g>
        );
      })}
      {trails.map((tr) => (
        <Trajectory key={tr.id} points={tr.pts} color={tr.id === playerId ? "#d4a24c" : colorOf(tr.id)} />
      ))}
      {scene.players.map((p) => {
        const meta = players.get(p.id);
        const side = meta?.side;
        return (
          <PlayerMarker
            key={p.id}
            x={p.x}
            y={p.y}
            flag={p.flag}
            color={colorOf(p.id)}
            number={meta?.number ?? null}
            goalkeeper={meta?.is_goalkeeper ?? false}
            selected={p.id === playerId}
            carrier={p.id === scene.carrier}
            dimmed={focusSide !== null && side !== focusSide}
            onSelect={() => selectPlayer(p.id === playerId ? null : p.id)}
          />
        );
      })}
      {scene.ball && <BallMarker x={scene.ball.x} y={scene.ball.y} flag={scene.ball.flag} />}
    </g>
  );
});
