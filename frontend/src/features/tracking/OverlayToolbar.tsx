import { useAppState, type TrailScope } from "@/app/providers/AppStateProvider";
import { Segmented } from "@/components/common/Segmented";
import { TRAIL_OPTIONS_S } from "@/utils/constants";

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-6 border px-2 text-[10px] font-medium uppercase tracking-[0.08em] transition-colors ${
        on ? "border-ink-500 bg-ink-700 text-ink-100" : "border-ink-700 text-ink-400 hover:text-ink-200"
      }`}
      aria-pressed={on}
    >
      {label}
    </button>
  );
}

export function OverlayToolbar() {
  const { overlays, setOverlays } = useAppState();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Toggle label="Hull" on={overlays.hull} onClick={() => setOverlays({ hull: !overlays.hull })} />
      <Toggle label="Centroid" on={overlays.centroid} onClick={() => setOverlays({ centroid: !overlays.centroid })} />
      <Toggle label="Trajectories" on={overlays.trails} onClick={() => setOverlays({ trails: !overlays.trails })} />
      {overlays.trails && (
        <>
          <Segmented<number>
            size="xs"
            value={overlays.trailSeconds}
            onChange={(v) => setOverlays({ trailSeconds: v })}
            options={TRAIL_OPTIONS_S.map((s) => ({ value: s, label: `${s}s` }))}
          />
          <Segmented<TrailScope>
            size="xs"
            value={overlays.trailScope}
            onChange={(v) => setOverlays({ trailScope: v })}
            options={[
              { value: "all", label: "All" },
              { value: "home", label: "Home" },
              { value: "away", label: "Away" },
              { value: "selected", label: "Selected" },
            ]}
          />
        </>
      )}
      <span className="mx-1 h-4 w-px bg-ink-700" />
      <Toggle
        label="Interpolate"
        on={overlays.interpolate}
        onClick={() => setOverlays({ interpolate: !overlays.interpolate })}
      />
    </div>
  );
}
