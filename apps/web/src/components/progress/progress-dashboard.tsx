"use client";

import type { ProgressDashboardData } from "@/lib/measurements/types";
import { hasProAccess } from "@/lib/billing/types";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import { appHeaderGap, appSectionStack } from "@/components/layout/page-layout";
import { buildEvidenceHref } from "@/lib/evidence/present";
import { CaliperCalculator } from "./caliper-calculator";
import { LogMeasurementForm } from "./log-measurement-form";
import { MeasurementTrendChart } from "./measurement-trend-chart";
import { WeightProjectionChart } from "./weight-projection-chart";

interface ProgressDashboardProps {
  data: ProgressDashboardData;
}

export function ProgressDashboard({ data }: ProgressDashboardProps) {
  const { gates } = data;
  const isPro = hasProAccess(gates.subscription);
  const horizonLabel = `${gates.horizonDays}-day`;

  return (
    <div className={`${appHeaderGap} ${appSectionStack}`}>
      {!data.tableReady && (
        <div className="rounded-2xl border border-forge-gold/40 bg-forge-surface-raised p-4 text-sm text-forge-muted">
          Apply the Phase 5 migration (`body_measurements` tables) to save new
          entries. Charts still use your onboarding baseline.
        </div>
      )}

      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Weight trend
        </h2>
        {gates.analyticsHistoryDays != null && (
          <p className="mt-1 text-xs text-forge-muted">
            Showing last {gates.analyticsHistoryDays} days on Free.{" "}
            <UpgradePrompt
              compact
              title=""
              description="Unlimited history is included with"
              suggestedTier="pro"
            />
          </p>
        )}
        <div className="mt-4">
          <MeasurementTrendChart series={data.trends} />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          {horizonLabel} projection
        </h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-forge-muted">
          <span>
            {isPro ? "Pro" : "Free"} tier · evidence-capped trend from your log
            {data.goal ? ` (${data.goal.replace(/_/g, " ")})` : ""}
          </span>
          <EvidenceExplainerLink
            href={buildEvidenceHref({ focus: "fat_loss_rate" })}
            label="How we cap projections"
          />
        </div>
        <div className="mt-4">
          <WeightProjectionChart
            projection={data.projection}
            showConfidenceBands={gates.showConfidenceBands}
            showGoalDate={gates.showGoalDate}
          />
        </div>
        {!isPro && (
          <div className="mt-4">
            <UpgradePrompt
              title="See 90 days ahead"
              description="Pro unlocks 90-day projections, confidence bands, and goal-date forecasts — plus strength analytics and unlimited history."
              suggestedTier="pro"
            />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Log measurement
        </h2>
        <div className="mt-4">
          <LogMeasurementForm />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Caliper body fat
        </h2>
        <p className="mt-1 text-xs text-forge-muted">
          Jackson-Pollock 3- or 7-site · saved to your progress log
        </p>
        <div className="mt-4">
          <CaliperCalculator sex={data.sex} age={data.age} />
        </div>
        {data.caliperEntries.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
            {data.caliperEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-forge-muted">{entry.measuredDate}</span>
                <span className="font-medium text-forge-text">
                  {entry.bodyFatPct}% · {entry.formula.toUpperCase()} (
                  {entry.sumMm} mm)
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
