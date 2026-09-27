import { InfoTip } from "@/components/common/InfoTip";
import type { PhaseAgreement } from "@/types/patterns";
import { clusterCode } from "@/utils/patternStyle";

const pretty = (l: string) => l.replace(/^(OOP|IP):/, "").replace(/^defending_/, "").replace(/_/g, " ");

/**
 * SkillCorner phase-of-play × cluster contingency, column-normalised (each cluster sums to 100%).
 * External reference only — phases are never used by the model.
 */
export function PhaseAgreementTable({ agreement }: { agreement: PhaseAgreement }) {
  const colTotals = agreement.clusters.map((_, r) => agreement.counts[r].reduce((a, b) => a + b, 0) || 1);
  const groups = [
    { name: "In possession", rows: agreement.labels.map((l, i) => ({ l, i })).filter((x) => x.l.startsWith("IP:")) },
    { name: "Out of possession", rows: agreement.labels.map((l, i) => ({ l, i })).filter((x) => x.l.startsWith("OOP:")) },
  ];
  return (
    <div>
      <div className="mb-3 flex items-center gap-5">
        <span className="flex items-baseline gap-2">
          <span className="label">NMI</span>
          <span className="value text-[13px]">{agreement.nmi?.toFixed(3) ?? "—"}</span>
        </span>
        <span className="flex items-baseline gap-2">
          <span className="label">ARI</span>
          <span className="value text-[13px]">{agreement.ari?.toFixed(3) ?? "—"}</span>
        </span>
        <span className="flex items-baseline gap-2">
          <span className="label">Windows</span>
          <span className="value text-[13px]">{agreement.n_windows.toLocaleString()}</span>
        </span>
        <InfoTip align="right">
          Each window is matched to the SkillCorner phase of play containing its midpoint, seen from the analysed team
          (in-possession phase if it had the ball, otherwise its out-of-possession phase). Phases are never used by the
          model; this only shows how the unsupervised clusters relate to an independent labelling. Columns sum to 100%.
        </InfoTip>
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th />
            {agreement.clusters.map((c) => (
              <th key={c} className="pb-1 text-center font-mono text-[10px] font-normal text-ink-400">{clusterCode(c)}</th>
            ))}
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.name}>
            <tr>
              <td colSpan={agreement.clusters.length + 1} className="pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.1em] text-ink-500">
                {g.name}
              </td>
            </tr>
            {g.rows.map(({ l, i }) => (
              <tr key={l}>
                <td className="whitespace-nowrap pr-3 text-ink-300">{pretty(l)}</td>
                {agreement.clusters.map((c, r) => {
                  const share = agreement.counts[r][i] / colTotals[r];
                  return (
                    <td key={c} className="p-px">
                      <div
                        className="h-[18px] min-w-[30px] text-center font-mono text-[10px] leading-[18px]"
                        style={{ background: `rgba(212,162,76,${Math.min(0.95, share * 1.8).toFixed(3)})`, color: share > 0.3 ? "#0a0b0d" : "#6c727b" }}
                        title={`${clusterCode(c)} · ${l}: ${agreement.counts[r][i]} windows (${(share * 100).toFixed(1)}%)`}
                      >
                        {share >= 0.05 ? Math.round(share * 100) : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
