"use client";

import type { CommunityMetricsSnapshot } from "@/lib/coaching/types";
import { wacpDelta } from "@/lib/coaching/community-recap-share";

interface CommunityOpsMetricsPanelProps {
  metrics: CommunityMetricsSnapshot;
}

function formatDelta(current: number, prior: number): string {
  const delta = wacpDelta(current, prior);
  if (delta === 0) return "flat vs last week";
  return delta > 0 ? `+${delta} vs last week` : `${delta} vs last week`;
}

export function CommunityOpsMetricsPanel({
  metrics,
}: CommunityOpsMetricsPanelProps) {
  const wacpTrend = formatDelta(metrics.wacp, metrics.wacpPriorWeek);

  return (
    <section className="rounded-2xl border border-forge-gold/25 bg-forge-surface p-4 sm:p-5">
      <h3 className="font-display text-sm font-semibold text-forge-text">
        Community metrics
      </h3>
      <p className="mt-1 text-xs text-forge-muted">
        Week of {metrics.weekStart} · WACP = Pro opt-in users with ≥1 community action
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="WACP" value={String(metrics.wacp)} hint={wacpTrend} />
        <MetricCard
          label="Opt-in rate"
          value={`${metrics.optInRate}%`}
          hint={`${metrics.optedIn}/${metrics.proEligible} Pro`}
        />
        <MetricCard
          label="7d activation"
          value={String(metrics.firstActionWithin7d)}
          hint="opted in + acted"
        />
        <MetricCard
          label="Flagged scores"
          value={String(metrics.flaggedScores)}
          hint="this week"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-forge-surface-raised p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-muted">
            Action mix (this week)
          </p>
          <ul className="mt-2 space-y-1 text-xs text-forge-text">
            <li>Score updates: {metrics.actionMix.score_upsert}</li>
            <li>Cheers: {metrics.actionMix.cheer}</li>
            <li>Follows: {metrics.actionMix.follow}</li>
            <li>Reactions: {metrics.actionMix.reaction}</li>
            <li>Comments: {metrics.actionMix.comment}</li>
            <li>New opt-ins: {metrics.actionMix.opt_in}</li>
          </ul>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-forge-surface-raised p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-muted">
            Opt-in A/B (Pro eligible)
          </p>
          <ul className="mt-2 space-y-1 text-xs text-forge-text">
            <li>
              Control: {metrics.variantBreakdown.control.optedIn}/
              {metrics.variantBreakdown.control.eligible}
            </li>
            <li>
              Default-on UI: {metrics.variantBreakdown.default_on_ui.optedIn}/
              {metrics.variantBreakdown.default_on_ui.eligible}
            </li>
          </ul>
          <p className="mt-2 text-[11px] text-forge-muted">
            Recap emails sent for {metrics.priorWeekStart}:{" "}
            {metrics.weeklyRecapEmailsSent}
          </p>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-forge-text">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-forge-muted">{hint}</p>
    </div>
  );
}
