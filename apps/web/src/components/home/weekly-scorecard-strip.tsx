import type { ScorecardPillar, WeeklyScorecard } from "@/lib/analytics/types";
import Link from "next/link";
import { EvidenceRuleInline } from "@/components/evidence/evidence-rule-inline";

const STATUS_STYLES: Record<
  ScorecardPillar["status"],
  { chip: string; icon: string }
> = {
  good: {
    chip: "border-forge-success/35 bg-forge-success/5 text-forge-text",
    icon: "text-forge-success",
  },
  watch: {
    chip: "border-forge-gold/40 bg-forge-gold/5 text-forge-text",
    icon: "text-forge-gold",
  },
  neutral: {
    chip: "border-[var(--border)] bg-forge-surface text-forge-muted",
    icon: "text-forge-muted",
  },
};

const STATUS_ICON: Record<ScorecardPillar["status"], string> = {
  good: "✓",
  watch: "⚠",
  neutral: "—",
};

interface WeeklyScorecardStripProps {
  scorecard: WeeklyScorecard;
  compact?: boolean;
}

function PillarChip({ pillar }: { pillar: ScorecardPillar }) {
  const style = STATUS_STYLES[pillar.status];

  return (
    <article
      className={`min-w-[7.5rem] shrink-0 rounded-xl border px-3 py-2.5 ${style.chip}`}
    >
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
        <span className={style.icon} aria-hidden>
          {STATUS_ICON[pillar.status]}
        </span>
        {pillar.label}
      </p>
      <p className="mt-1 text-xs leading-snug">{pillar.summary}</p>
    </article>
  );
}

export function WeeklyScorecardStrip({
  scorecard,
  compact = false,
}: WeeklyScorecardStripProps) {
  const visiblePillars = compact
    ? scorecard.pillars.filter((pillar) => pillar.status !== "neutral")
    : scorecard.pillars;

  if (visiblePillars.length === 0) {
    return null;
  }

  const citedRules = scorecard.evidenceRuleIds.slice(0, 3);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
            Weekly scorecard
          </h2>
          {scorecard.headline && (
            <p className="mt-1 text-sm font-medium text-forge-gold">
              {scorecard.headline}
            </p>
          )}
        </div>
        <Link
          href="/progress"
          className="shrink-0 text-xs font-semibold text-forge-steel hover:text-forge-ember"
        >
          View trends →
        </Link>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(compact ? visiblePillars : scorecard.pillars).map((pillar) => (
          <PillarChip key={pillar.id} pillar={pillar} />
        ))}
      </div>

      {citedRules.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px] text-forge-muted">
          <span>Based on</span>
          {citedRules.map((ruleId, index) => (
            <span key={ruleId} className="inline-flex items-center gap-1">
              {index > 0 && <span aria-hidden>·</span>}
              <EvidenceRuleInline ruleId={ruleId} />
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
