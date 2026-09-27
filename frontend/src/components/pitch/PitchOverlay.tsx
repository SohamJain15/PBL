import type { ReactNode } from "react";

/** Team centroid marker (cross) in raw pitch coordinates. */
export function CentroidMarker({ x, y, color }: { x: number; y: number; color: string }) {
  const s = 1.1;
  return (
    <g transform={`translate(${x} ${-y})`} style={{ pointerEvents: "none" }}>
      <circle r={1.6} fill="none" stroke={color} strokeWidth={0.14} strokeOpacity={0.9} />
      <line x1={-s} y1={0} x2={s} y2={0} stroke={color} strokeWidth={0.16} />
      <line x1={0} y1={-s} x2={0} y2={s} stroke={color} strokeWidth={0.16} />
    </g>
  );
}

/** Pitch viewport: SVG sized to the container with the pitch aspect ratio preserved. */
export function PitchSvg({
  length,
  width,
  children,
  onBackgroundClick,
}: {
  length: number;
  width: number;
  children: ReactNode;
  onBackgroundClick?: () => void;
}) {
  const m = 3;
  return (
    <svg
      viewBox={`${-length / 2 - m} ${-width / 2 - m} ${length + 2 * m} ${width + 2 * m}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full select-none"
      onClick={onBackgroundClick}
    >
      {children}
    </svg>
  );
}
