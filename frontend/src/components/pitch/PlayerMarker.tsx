import { memo } from "react";
import { FLAG_EXTRAPOLATED } from "@/types/tracking";
import { PLAYER_RADIUS_M } from "@/utils/constants";

interface Props {
  x: number;
  y: number;
  color: string;
  number: number | null;
  flag: number;
  goalkeeper: boolean;
  selected: boolean;
  carrier: boolean;
  dimmed: boolean;
  onSelect: () => void;
}

/** Detected = solid; extrapolated by the provider = translucent with dashed outline. */
export const PlayerMarker = memo(function PlayerMarker({
  x, y, color, number, flag, goalkeeper, selected, carrier, dimmed, onSelect,
}: Props) {
  const extrapolated = flag === FLAG_EXTRAPOLATED;
  return (
    <g
      transform={`translate(${x} ${-y})`}
      opacity={dimmed ? 0.35 : 1}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{ cursor: "pointer" }}
    >
      {carrier && <circle r={PLAYER_RADIUS_M + 0.45} fill="none" stroke="#f4f1e8" strokeWidth={0.14} strokeOpacity={0.85} />}
      {selected && <circle r={PLAYER_RADIUS_M + 0.9} fill="none" stroke="var(--color-accent)" strokeWidth={0.22} />}
      <circle
        r={PLAYER_RADIUS_M}
        fill={color}
        fillOpacity={extrapolated ? 0.4 : 1}
        stroke={goalkeeper ? "#f2f2ee" : extrapolated ? color : "#0a0b0d"}
        strokeWidth={goalkeeper ? 0.22 : 0.14}
        strokeDasharray={extrapolated ? "0.35 0.25" : undefined}
      />
      {number !== null && (
        <text
          y={0.36}
          textAnchor="middle"
          fontSize={1.0}
          fontWeight={600}
          fill={extrapolated ? "#e6e7e4" : "#0a0b0d"}
          style={{ pointerEvents: "none", fontFamily: "var(--font-sans)" }}
        >
          {number}
        </text>
      )}
    </g>
  );
});
