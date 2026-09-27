/** Visual treatment per tactical interpretation. Unlabelled clusters stay neutral. */
const STYLES: Record<string, { color: string; short: string }> = {
  "Defensive Compression": { color: "#d4a24c", short: "Compression" },
  "Defensive Shift": { color: "#8fb3c9", short: "Shift" },
  "Wing Expansion": { color: "#9cc59a", short: "Expansion" },
  "Local Overload": { color: "#c9867a", short: "Overload" },
};
const NEUTRAL = ["#6c727b", "#7d8590", "#585e66", "#8f959c", "#666c74", "#767d86", "#5d636b", "#878d95"];

export function patternColor(label: string | null, clusterId: number): string {
  return label && STYLES[label] ? STYLES[label].color : NEUTRAL[clusterId % NEUTRAL.length];
}

export function patternShort(label: string | null): string {
  return label && STYLES[label] ? STYLES[label].short : "Unlabelled";
}

export function clusterCode(id: number): string {
  return `C${String(id + 1).padStart(2, "0")}`;
}

export const TEAM_COLORS = { home: "#7ea6d6", away: "#d98b6f" } as const;
