import type { ReactNode } from "react";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/app/providers/AppStateProvider";
import { InfoTip } from "@/components/common/InfoTip";
import { Centered, ErrorNote, Loading } from "@/components/common/Status";
import { ClusterTable } from "@/features/patterns/ClusterTable";
import { EmbeddingPlot } from "@/features/patterns/EmbeddingPlot";
import { PhaseAgreementTable } from "@/features/patterns/PhaseAgreementTable";
import { ProfileBars } from "@/features/patterns/ProfileBars";
import { useMatch } from "@/hooks/useMatch";
import { usePatterns } from "@/hooks/usePatterns";
import type { DiscoverySummary, EmbeddingPoint } from "@/types/patterns";
import type { MatchDetail } from "@/types/match";
import { clockShort } from "@/utils/formatting";
import { clusterCode, patternColor, TEAM_COLORS } from "@/utils/patternStyle";

const REPRESENTATIVES_SHOWN = 8;

function Header({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex h-9 items-center justify-between border-b border-ink-700 px-4">
      <h2 className="label text-ink-200">{title}</h2>
      {right}
    </div>
  );
}

function MethodStrip({ d }: { d: DiscoverySummary }) {
  const scores = Object.entries(d.k_scores).map(([k, v]) => ({ k: Number(k), v }));
  const max = Math.max(...scores.map((s) => s.v));
  return (
    <div className="flex h-14 items-center gap-8 border-b border-ink-700 bg-ink-900 px-4">
      <div>
        <div className="label">Method</div>
        <div className="mt-0.5 text-[12px] text-ink-200">{d.method}</div>
      </div>
      <div>
        <div className="label">Windows</div>
        <div className="value mt-0.5 text-[13px]">
          {d.n_windows.toLocaleString()} <span className="text-[11px] text-ink-500">{d.window_s}s / step {d.step_s}s</span>
        </div>
      </div>
      <div>
        <div className="label">Features</div>
        <div className="value mt-0.5 text-[13px]">{d.features.length}</div>
      </div>
      <div>
        <div className="label flex items-center gap-1">
          k · silhouette
          <InfoTip>
            Mean silhouette for each candidate k (higher = better separated). Values near 0.1–0.2 mean the windows form a
            continuum rather than well-separated groups — clusters are useful partitions, not discrete tactical states.
          </InfoTip>
        </div>
        <div className="mt-1 flex items-end gap-1">
          {scores.map((s) => (
            <div key={s.k} className="flex flex-col items-center gap-0.5" title={`k=${s.k}: ${s.v.toFixed(3)}`}>
              <div className="w-4 bg-ink-600" style={{ height: `${(s.v / max) * 18}px`, background: s.k === d.k ? "var(--color-accent)" : undefined }} />
              <span className={`font-mono text-[9px] ${s.k === d.k ? "text-accent" : "text-ink-500"}`}>{s.k}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="label">Selected</div>
        <div className="value mt-0.5 text-[13px]">
          k={d.k} <span className="text-[11px] text-ink-500">s={d.k_scores[String(d.k)]?.toFixed(3)}</span>
        </div>
      </div>
      <div className="ml-auto text-right">
        <div className="label">Runtime</div>
        <div className="value mt-0.5 text-[13px]">{d.runtime_s.toFixed(1)}s</div>
      </div>
    </div>
  );
}

function ClusterDetail({
  d, clusterId, match, onReplay,
}: { d: DiscoverySummary; clusterId: number; match: MatchDetail; onReplay: (episodeId: number) => void }) {
  const c = d.clusters.find((x) => x.id === clusterId);
  if (!c) return null;
  const color = patternColor(c.interpretation.label, c.id);
  const reps = d.episodes
    .filter((e) => e.cluster_id === c.id)
    .sort((a, b) => a.distance_to_centroid - b.distance_to_centroid)
    .slice(0, REPRESENTATIVES_SHOWN);
  const rule = d.rules.find((r) => r.label === c.interpretation.label);
  return (
    <div className="fade-in">
      <div className="border-b border-ink-700 px-4 py-3">
        <div className="label">Model-discovered pattern</div>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="h-3 w-3 self-center" style={{ background: color }} />
          <span className="whitespace-nowrap font-mono text-[17px]">Cluster {clusterCode(c.id).slice(1)}</span>
          <span className="text-[11px] text-ink-400">
            {c.n_windows} windows · {c.n_episodes} sequences · avg {c.avg_duration_s.toFixed(1)}s
          </span>
        </div>
      </div>
      <div className="border-b border-ink-700 px-4 py-3">
        <div className="label mb-2">Feature profile (z)</div>
        <ProfileBars profile={c.profile} color={color} />
      </div>
      <div className="border-b border-ink-700 px-4 py-3">
        <div className="label flex items-center gap-1.5">
          Tactical interpretation
          <InfoTip align="right">
            Rules applied to cluster-mean z-scores. Catalogue:
            {d.rules.map((r) => (
              <span key={r.label} className="mt-1 block">
                <b className="font-medium text-ink-100">{r.label}</b> — {r.rule}
              </span>
            ))}
          </InfoTip>
        </div>
        <div className={`mt-1 text-[15px] ${c.interpretation.label ? "text-ink-100" : "text-ink-500"}`}>
          {c.interpretation.label ?? "No rule matched"}
        </div>
        {rule && <div className="mt-1 font-mono text-[10px] text-ink-400">{rule.rule}</div>}
        {c.interpretation.rules_matched.length > 1 && (
          <div className="mt-1 text-[11px] text-ink-400">Also matches: {c.interpretation.rules_matched.slice(1).join(", ")}</div>
        )}
      </div>
      <div className="px-4 py-3">
        <div className="label mb-2">Representative sequences</div>
        {reps.map((e) => (
          <button
            key={e.id}
            onClick={() => onReplay(e.id)}
            className="group grid w-full grid-cols-[14px_40px_1fr_48px_20px] items-center gap-2 border-b border-ink-800 py-1.5 text-left hover:bg-ink-850"
          >
            <span className="h-2 w-2" style={{ background: TEAM_COLORS[e.side] }} />
            <span className="font-mono text-[11px] text-ink-300">{match[e.side].acronym}</span>
            <span className="font-mono text-[12px]">
              P{e.period} {clockShort(e.start_s)}–{clockShort(e.end_s)}
            </span>
            <span className="text-right font-mono text-[11px] text-ink-400">{e.duration_s.toFixed(0)}s</span>
            <Play size={11} className="text-ink-500 group-hover:text-accent" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function PatternsPage() {
  const navigate = useNavigate();
  const match = useMatch();
  const patterns = usePatterns(Boolean(match.data?.tracking_available));
  const { selectEpisode } = useAppState();
  const [cluster, setCluster] = useState<number | null>(null);
  const d = patterns.data;

  useEffect(() => {
    if (d && (cluster === null || !d.clusters.some((c) => c.id === cluster))) {
      const firstLabelled = d.clusters.find((c) => c.interpretation.label) ?? d.clusters[0];
      setCluster(firstLabelled?.id ?? null);
    }
  }, [d, cluster]);

  if (patterns.error) return <Centered><ErrorNote error={patterns.error} /></Centered>;
  if (!d || !match.data) return <Centered><Loading label="Analyzing" /></Centered>;

  const replay = (episodeId: number) => {
    selectEpisode(episodeId);
    navigate("/match");
  };
  const pick = (p: EmbeddingPoint) => {
    const ep = d.episodes.find(
      (e) => e.side === p.side && e.period === p.period && e.cluster_id === p.cluster_id && p.start_s >= e.start_s - 1e-6 && p.start_s < e.end_s,
    );
    if (ep) replay(ep.id);
  };

  return (
    <div className="flex h-full flex-col">
      <MethodStrip d={d} />
      <div className="flex min-h-0 flex-1">
        <div className="scroll-thin min-w-0 flex-1 overflow-y-auto">
          <Header title="Patterns" right={<span className="font-mono text-[10px] text-ink-500">{match.data.home.acronym} v {match.data.away.acronym} · both teams</span>} />
          <ClusterTable
            clusters={d.clusters}
            selected={cluster}
            onSelect={setCluster}
            homeLabel={match.data.home.acronym}
            awayLabel={match.data.away.acronym}
          />
          <div className="grid grid-cols-1 border-t border-ink-700 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="border-ink-700 xl:border-r">
              <Header
                title="Embedding"
                right={<span className="font-mono text-[10px] text-ink-500">{d.embedding.length.toLocaleString()} of {d.n_windows.toLocaleString()} windows</span>}
              />
              <div className="p-3">
                <EmbeddingPlot points={d.embedding} clusters={d.clusters} selected={cluster} explained={d.pca_explained} onPick={pick} />
              </div>
            </div>
            <div>
              <Header title="Agreement with SkillCorner phases" />
              <div className="p-4">{d.phase_agreement ? <PhaseAgreementTable agreement={d.phase_agreement} /> : <span className="text-ink-500">—</span>}</div>
            </div>
          </div>
        </div>
        <aside className="scroll-thin w-[360px] shrink-0 overflow-y-auto border-l border-ink-700 bg-ink-900">
          {cluster !== null && <ClusterDetail d={d} clusterId={cluster} match={match.data} onReplay={replay} />}
        </aside>
      </div>
    </div>
  );
}
