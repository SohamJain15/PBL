import { memo } from "react";

interface Props {
  length: number;
  width: number;
}

// IFAB dimensions (metres)
const CIRCLE_R = 9.15;
const BOX_DEPTH = 16.5;
const BOX_WIDTH = 40.32;
const SIX_DEPTH = 5.5;
const SIX_WIDTH = 18.32;
const SPOT_DIST = 11;
const GOAL_WIDTH = 7.32;
const GOAL_DEPTH = 1.8;
const CORNER_R = 1;
const STRIPES = 14;
const LINE = "rgba(236, 240, 232, 0.62)";
const LW = 0.16;

/** Static pitch, drawn once in metre coordinates (origin at the centre spot). */
export const FootballPitch = memo(function FootballPitch({ length, width }: Props) {
  const hl = length / 2;
  const hw = width / 2;
  const stripeW = length / STRIPES;
  // penalty arc: part of the 9.15 m circle around the spot that lies outside the box
  const arcDx = BOX_DEPTH - SPOT_DIST;
  const arcDy = Math.sqrt(CIRCLE_R ** 2 - arcDx ** 2);

  const end = (sign: 1 | -1) => {
    const gx = sign * hl;
    const inward = -sign;
    return (
      <g key={sign}>
        <rect
          x={Math.min(gx, gx + inward * BOX_DEPTH)}
          y={-BOX_WIDTH / 2}
          width={BOX_DEPTH}
          height={BOX_WIDTH}
          fill="none"
        />
        <rect
          x={Math.min(gx, gx + inward * SIX_DEPTH)}
          y={-SIX_WIDTH / 2}
          width={SIX_DEPTH}
          height={SIX_WIDTH}
          fill="none"
        />
        <circle cx={gx + inward * SPOT_DIST} cy={0} r={0.22} fill={LINE} stroke="none" />
        <path
          d={`M ${gx + inward * BOX_DEPTH} ${-arcDy} A ${CIRCLE_R} ${CIRCLE_R} 0 0 ${sign === 1 ? 0 : 1} ${gx + inward * BOX_DEPTH} ${arcDy}`}
          fill="none"
        />
        <rect
          x={Math.min(gx, gx + sign * GOAL_DEPTH)}
          y={-GOAL_WIDTH / 2}
          width={GOAL_DEPTH}
          height={GOAL_WIDTH}
          fill="rgba(236,240,232,0.08)"
        />
      </g>
    );
  };

  const corner = (sx: 1 | -1, sy: 1 | -1) => {
    const x = sx * hl;
    const y = sy * hw;
    const sweep = sx * sy > 0 ? 1 : 0;
    return (
      <path
        key={`${sx}${sy}`}
        d={`M ${x - sx * CORNER_R} ${y} A ${CORNER_R} ${CORNER_R} 0 0 ${sweep} ${x} ${y - sy * CORNER_R}`}
        fill="none"
      />
    );
  };

  return (
    <g>
      <rect x={-hl - 4} y={-hw - 4} width={length + 8} height={width + 8} fill="#24462e" />
      {Array.from({ length: STRIPES }, (_, i) => (
        <rect
          key={i}
          x={-hl + i * stripeW}
          y={-hw}
          width={stripeW}
          height={width}
          fill={i % 2 === 0 ? "var(--color-pitch)" : "var(--color-pitch-alt)"}
        />
      ))}
      <g stroke={LINE} strokeWidth={LW} fill="none">
        <rect x={-hl} y={-hw} width={length} height={width} />
        <line x1={0} y1={-hw} x2={0} y2={hw} />
        <circle cx={0} cy={0} r={CIRCLE_R} />
        <circle cx={0} cy={0} r={0.25} fill={LINE} stroke="none" />
        {end(1)}
        {end(-1)}
        {corner(1, 1)}
        {corner(1, -1)}
        {corner(-1, 1)}
        {corner(-1, -1)}
      </g>
    </g>
  );
});
