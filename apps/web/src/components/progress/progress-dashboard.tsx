"use client";

import { DailyActivityPanel } from "@/components/activity/daily-activity-panel";
import type { ProgressDashboardData } from "@/lib/measurements/types";
import { hasFeature } from "@/lib/billing/gates";
import { hasProAccess } from "@/lib/billing/types";
import { ProFeatureSection } from "@/components/billing/pro-feature-section";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import { appHeaderGap, appSectionStack } from "@/components/layout/page-layout";
import { buildEvidenceHref } from "@/lib/evidence/present";
import { CaliperCalculator } from "./caliper-calculator";
import { LogMeasurementForm } from "./log-measurement-form";
import { MeasurementTrendChart } from "./measurement-trend-chart";
import { WeightProjectionChart } from "./weight-projection-chart";
import { WaistProjectionChart } from "./waist-projection-chart";
import { StrengthProgressionChart } from "./strength-progression-chart";
import { PrHistoryList } from "./pr-history-list";
import { VolumeTrendChart } from "./volume-trend-chart";
import { RuleInsightsCard } from "./rule-insights-card";
import { ProgressPhotoTimeline } from "./progress-photo-timeline";

interface ProgressDashboardProps {
  data: ProgressDashboardData;
}

export function ProgressDashboard({ data }: ProgressDashboardProps) {
  const { gates } = data;
  const subscription = gates.subscription;
  const isPro = hasProAccess(subscription);
  const horizonLabel = `${gates.horizonDays}-day`;
  const analytics = data.proAnalytics;

  return (
    <div className={`${appHeaderGap} ${appSectionStack}`}>
      {!data.tableReady && (
        <div className="rounded-2xl border border-forge-gold/40 bg-forge-surface-raised p-4 text-sm text-forge-muted">
          Apply the Phase 5 migration (`body_measurements` tables) to save new
          entries. Charts still use your onboarding baseline.
        </div>
      )}

      <ProFeatureSection
        title="Trend insights"
        description="Rule-based signals from your logs — not AI guesswork."
        unlocked={hasFeature(subscription, "rule_based_insights")}
      >
        <RuleInsightsCard insights={analytics?.insights ?? []} />
      </ProFeatureSection>

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
          {horizonLabel} weight projection
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
        <div className="mt-4 min-w-0">
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
              description="Pro unlocks 90-day projections, confidence bands, and goal-date forecasts."
              suggestedTier="pro"
            />
          </div>
        )}
      </section>

      <ProFeatureSection
        title={`${horizonLabel} waist projection`}
        description="Linear trend from your logged waist measurements — separate from weight pacing."
        unlocked={gates.showWaistProjection}
      >
        <WaistProjectionChart
          projection={data.waistProjection}
          showGoalDate={gates.showGoalDate}
        />
        {gates.showWaistProjection && !data.waistProjection && (
          <p className="mt-3 text-xs text-forge-muted">
            {data.hasWaistHistory
              ? "Log waist on at least two dates to see a projection."
              : "Add waist to your measurement logs to unlock this chart."}
          </p>
        )}
      </ProFeatureSection>

      <ProFeatureSection
        title="Strength progression"
        description="Estimated 1RM trends for compound lifts from logged work."
        unlocked={hasFeature(subscription, "strength_analytics")}
      >
        <StrengthProgressionChart series={analytics?.strengthSeries ?? []} />
      </ProFeatureSection>

      <ProFeatureSection
        title="PR history"
        description="Templated PR badges when sets beat your previous best."
        unlocked={hasFeature(subscription, "pr_history")}
      >
        <PrHistoryList records={analytics?.prHistory ?? []} />
      </ProFeatureSection>

      <ProFeatureSection
        title="Training volume"
        description="Weekly load and top muscle groups from completed sessions."
        unlocked={hasFeature(subscription, "volume_analytics")}
      >
        <VolumeTrendChart
          weeklyVolume={analytics?.weeklyVolume ?? []}
          muscleVolume={analytics?.muscleVolume ?? []}
        />
      </ProFeatureSection>

      <ProFeatureSection
        title="Daily activity"
        description="Steps and active calories imported from Fitbit via Google Health."
        unlocked={hasFeature(subscription, "device_integrations")}
        suggestedTier="pro_plus"
      >
        <DailyActivityPanel activity={data.activity} />
      </ProFeatureSection>

      <ProFeatureSection
        title="Progress photos"
        description="Private photo timeline tied to your check-in dates."
        unlocked={hasFeature(subscription, "progress_photos")}
      >
        <ProgressPhotoTimeline
          initialPhotos={data.progressPhotos}
          tableReady={data.photosTableReady}
        />
      </ProFeatureSection>

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
