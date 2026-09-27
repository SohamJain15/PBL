import { hullPoints } from "@/utils/coordinates";

export function TeamHull({ hull, color, emphasis }: { hull: number[]; color: string; emphasis: boolean }) {
  return (
    <polygon
      points={hullPoints(hull)}
      fill={color}
      fillOpacity={emphasis ? 0.14 : 0.06}
      stroke={color}
      strokeOpacity={emphasis ? 0.8 : 0.4}
      strokeWidth={emphasis ? 0.22 : 0.14}
      strokeLinejoin="round"
      style={{ pointerEvents: "none", transition: "fill-opacity 200ms, stroke-opacity 200ms" }}
    />
  );
}
