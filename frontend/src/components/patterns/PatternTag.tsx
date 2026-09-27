import { clusterCode, patternColor } from "@/utils/patternStyle";

export function PatternSwatch({ label, clusterId, size = 8 }: { label: string | null; clusterId: number; size?: number }) {
  return <span className="inline-block shrink-0" style={{ width: size, height: size, background: patternColor(label, clusterId) }} />;
}

export function PatternName({ label, clusterId }: { label: string | null; clusterId: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <PatternSwatch label={label} clusterId={clusterId} />
      <span className={label ? "text-ink-100" : "text-ink-400"}>{label ?? "Unlabelled"}</span>
      <span className="font-mono text-[10px] text-ink-500">{clusterCode(clusterId)}</span>
    </span>
  );
}
