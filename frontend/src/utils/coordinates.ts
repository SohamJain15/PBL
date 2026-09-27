/**
 * Pitch coordinates are metres with the origin at the centre spot (SkillCorner convention).
 * SVG y grows downwards, so rendering flips y: svgY = -y.
 */
export const toSvg = (x: number, y: number): [number, number] => [x, -y];

export function hullPoints(flat: number[]): string {
  const out: string[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) out.push(`${flat[i]},${-flat[i + 1]}`);
  return out.join(" ");
}
