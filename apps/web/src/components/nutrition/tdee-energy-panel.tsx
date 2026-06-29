"use client";

import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import { buildEvidenceHref } from "@/lib/evidence/present";
import type { TdeeDashboard } from "@/lib/nutrition/tdee-service";
import type { PlanTdeeBreakdown, TdeeSegment } from "@forgefit/program-engine";
import { describeEffectiveDeficit } from "@forgefit/program-engine";
import type { AdaptiveTdeeResult } from "@forgefit/projection-engine";

interface TdeeEnergyPanelProps {
  dashboard: TdeeDashboard;
}

const SEGMENT_COLORS: Record<string, string> = {
  bmr: "bg-forge-steel",
  daily_life: "bg-forge-gold",
  training: "bg-forge-coral",
  goal_adjustment: "bg-forge-ember",
};

export function TdeeEnergyPanel({ dashboard }: TdeeEnergyPanelProps) {
  return (
    <section
      id="energy-budget"
      className="scroll-mt-6 rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5"
    >
      <div>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Your energy budget
        </h2>
        <p className="mt-1 text-sm text-forge-muted">
          Three views of the same idea: how many calories you burn, what your
          plan recommends, and (with Pro) what your logs suggest.
        </p>
      </div>

      <div className="mt-5 space-y-6">
        {dashboard.plan ? (
          <PlanBreakdownSection
            breakdown={dashboard.plan}
            enrichedFromProgram={dashboard.enrichedFromProgram}
            nutritionContext={dashboard.nutritionContext}
          />
        ) : (
          <PlanBreakdownPlaceholder />
        )}
        {dashboard.daily ? (
          <DailyEnergySection daily={dashboard.daily} />
        ) : (
          <DailyEnergyPlaceholder />
        )}
        <AdaptiveSection dashboard={dashboard} />
      </div>
    </section>
  );
}

function PlanBreakdownSection({
  breakdown,
  enrichedFromProgram,
  nutritionContext,
}: {
  breakdown: PlanTdeeBreakdown;
  enrichedFromProgram?: boolean;
  nutritionContext?: TdeeDashboard["nutritionContext"];
}) {
  const stackSegments = breakdown.segments.filter(
    (segment) => segment.id !== "goal_adjustment"
  );
  const stackTotal = stackSegments.reduce((sum, segment) => sum + segment.kcal, 0);
  const goalSegment = breakdown.segments.find(
    (segment) => segment.id === "goal_adjustment"
  );
  const showStack = stackTotal > 0 && stackSegments.length > 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-forge-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-semibold text-forge-text">
            1. Program estimate
          </p>
          <p className="mt-1 text-xs text-forge-muted">
            {breakdown.isLegacyEstimate
              ? "A starting point from your profile until your program refreshes with detailed energy math."
              : enrichedFromProgram
                ? "Built from your current program and body stats — your saved plan did not include a detailed breakdown yet."
                : "Built from your body stats, daily movement, and planned workouts."}
          </p>
        </div>
        <EvidenceExplainerLink
          href={buildEvidenceHref({
            focus: "tdee_estimation",
            related: breakdown.trainingRuleId
              ? [breakdown.trainingRuleId]
              : undefined,
          })}
          label="How we estimate"
        />
      </div>

      {showStack && (
        <div className="mt-4">
          <div className="flex h-3 overflow-hidden rounded-full bg-forge-surface-raised">
            {stackSegments.map((segment) => (
              <div
                key={segment.id}
                className={`${SEGMENT_COLORS[segment.id] ?? "bg-forge-steel"}`}
                style={{
                  width: `${Math.max(4, (segment.kcal / stackTotal) * 100)}%`,
                }}
                title={`${segment.label}: ${segment.kcal} kcal`}
              />
            ))}
          </div>
          <ul className="mt-3 space-y-2">
            {stackSegments.map((segment) => (
              <SegmentRow key={segment.id} segment={segment} />
            ))}
          </ul>
          {!breakdown.isLegacyEstimate && (
            <p className="mt-3 text-sm font-medium text-forge-text">
              Maintenance (TDEE): ~{breakdown.tdeeKcal.toLocaleString()} kcal/day
            </p>
          )}
        </div>
      )}

      {breakdown.isLegacyEstimate && showStack && (
        <p className="mt-3 text-sm font-medium text-forge-text">
          Estimated maintenance: ~{breakdown.tdeeKcal.toLocaleString()} kcal/day
        </p>
      )}

      {!goalSegment && breakdown.goalLabel !== "maintenance" && (
        <p className="mt-2 text-sm text-forge-muted">
          {breakdown.goalLabel === "deficit" ? "Minus" : "Plus"}{" "}
          <span className="font-semibold text-forge-ember">
            {Math.abs(breakdown.goalAdjustmentKcal).toLocaleString()} kcal
          </span>{" "}
          for your {breakdown.goalLabel === "deficit" ? "fat-loss" : "muscle-gain"}{" "}
          goal → target{" "}
          <span className="font-semibold text-forge-text">
            {breakdown.targetCalories.toLocaleString()} kcal
          </span>
        </p>
      )}

      {goalSegment && breakdown.goalLabel !== "maintenance" && (
        <p className="mt-2 text-sm text-forge-muted">
          {breakdown.goalLabel === "deficit" ? "Minus" : "Plus"}{" "}
          <span className="font-semibold text-forge-ember">
            {goalSegment.kcal.toLocaleString()} kcal
          </span>{" "}
          for your {breakdown.goalLabel === "deficit" ? "fat-loss" : "muscle-gain"}{" "}
          goal → target{" "}
          <span className="font-semibold text-forge-text">
            {breakdown.targetCalories.toLocaleString()} kcal
          </span>
        </p>
      )}

      {breakdown.goalLabel === "maintenance" && (
        <p className="mt-2 text-sm text-forge-muted">
          Target matches maintenance at{" "}
          <span className="font-semibold text-forge-text">
            {breakdown.targetCalories.toLocaleString()} kcal
          </span>
        </p>
      )}

      {nutritionContext?.paceSummary && (
        <p className="mt-3 rounded-lg border border-[var(--border)] bg-forge-surface px-3 py-2 text-sm text-forge-muted">
          <span className="font-semibold text-forge-text">
            {nutritionContext.paceLabel ?? "Your pace"}:
          </span>{" "}
          {nutritionContext.paceSummary}
        </p>
      )}

      {nutritionContext?.effectiveDeficitKcal != null &&
        (nutritionContext.goal === "fat_loss" ||
          nutritionContext.goal === "recomposition") && (
          <p className="mt-2 text-xs text-forge-muted">
            {describeEffectiveDeficit(
              nutritionContext.effectiveDeficitKcal,
              nutritionContext.goal
            )}
          </p>
        )}
    </div>
  );
}

function PlanBreakdownPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-forge-surface p-4">
      <p className="font-display text-sm font-semibold text-forge-text">
        1. Program estimate
      </p>
      <p className="mt-2 text-sm text-forge-muted">
        Finish onboarding and generate a training program to see how your calorie
        target is built from rest, movement, and workouts.
      </p>
    </div>
  );
}

function SegmentRow({ segment }: { segment: TdeeSegment }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span
        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${SEGMENT_COLORS[segment.id] ?? "bg-forge-steel"}`}
        aria-hidden
      />
      <div>
        <span className="font-medium text-forge-text">
          {segment.label}: {segment.kcal.toLocaleString()} kcal
        </span>
        <p className="text-xs text-forge-muted">{segment.hint}</p>
      </div>
    </li>
  );
}

function DailyEnergySection({
  daily,
}: {
  daily: NonNullable<TdeeDashboard["daily"]>;
}) {
  const compareTarget = daily.dynamicTargetKcal;
  const pct =
    compareTarget > 0
      ? Math.min(100, Math.round((daily.intakeKcal / compareTarget) * 100))
      : 0;
  const remaining = compareTarget - daily.intakeKcal;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-forge-surface p-4">
      <p className="font-display text-sm font-semibold text-forge-text">
        2. Today&apos;s picture
      </p>
      <p className="mt-1 text-xs text-forge-muted">
        Compares what you&apos;ve eaten to a target that adjusts when you log a
        workout.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <StatTile
          label="Logged today"
          value={`${daily.intakeKcal.toLocaleString()} kcal`}
        />
        <StatTile
          label="Today's target"
          value={`${compareTarget.toLocaleString()} kcal`}
          hint={
            daily.isTrainingDay
              ? `Includes ~${daily.actualTrainingKcal} kcal from ${daily.completedWorkouts} workout${daily.completedWorkouts === 1 ? "" : "s"}`
              : daily.planTrainingKcalPerDay > 0
                ? `Plan averages ~${daily.planTrainingKcalPerDay} kcal/day from training`
                : undefined
          }
        />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-forge-muted">
          <span>Intake vs today&apos;s target</span>
          <span>
            {remaining > 0
              ? `${remaining.toLocaleString()} kcal left`
              : remaining < -50
                ? `${Math.abs(remaining).toLocaleString()} kcal over`
                : "At target"}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-forge-surface-raised">
          <div
            className="h-full rounded-full bg-forge-ember"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-forge-muted">{daily.targetNote}</p>
      <p className="mt-1 text-xs text-forge-muted">
        Static program target: {daily.targetKcal.toLocaleString()} kcal (weekly
        average).
      </p>
    </div>
  );
}

function DailyEnergyPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-forge-surface p-4">
      <p className="font-display text-sm font-semibold text-forge-text">
        2. Today&apos;s picture
      </p>
      <p className="mt-2 text-sm text-forge-muted">
        Calorie targets appear here once your program includes nutrition goals.
      </p>
    </div>
  );
}

function AdaptiveSection({ dashboard }: { dashboard: TdeeDashboard }) {
  if (!dashboard.adaptiveUnlocked) {
    return (
      <div className="rounded-xl border border-forge-gold/25 bg-forge-gold/5 p-4">
        <p className="font-display text-sm font-semibold text-forge-text">
          3. Your metabolism (from logs)
        </p>
        <p className="mt-1 text-xs text-forge-muted">
          After ~2 weeks of consistent food and weight logs, ForgeRep can
          estimate your real maintenance calories — not just the formula.
        </p>
        <div className="mt-3">
          <UpgradePrompt
            compact
            suggestedTier="pro"
            title="Unlock adaptive TDEE"
            description="Upgrade to Pro to see a personalized maintenance estimate with confidence bands, learned from your intake and scale trend."
          />
        </div>
      </div>
    );
  }

  if (!dashboard.adaptive) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-forge-surface p-4">
        <p className="font-display text-sm font-semibold text-forge-text">
          3. Your metabolism (from logs)
        </p>
        <p className="mt-2 text-sm text-forge-muted">
          Keep logging meals and weigh in at least twice over two weeks. We&apos;ll
          show your personalized TDEE here once there&apos;s enough data.
        </p>
        <ul className="mt-3 list-inside list-disc text-xs text-forge-muted">
          <li>Log food on most days (rough macros are fine)</li>
          <li>Record weight in Progress at least every few days</li>
          <li>We compare intake vs weight change — no guesswork about &quot;activity level&quot;</li>
        </ul>
      </div>
    );
  }

  return <AdaptiveEstimateSection adaptive={dashboard.adaptive} />;
}

function AdaptiveEstimateSection({
  adaptive,
}: {
  adaptive: AdaptiveTdeeResult;
}) {
  const low = adaptive.estimatedTdeeKcal - adaptive.confidenceBandKcal;
  const high = adaptive.estimatedTdeeKcal + adaptive.confidenceBandKcal;
  const confidenceLabel =
    adaptive.confidence === "high"
      ? "High confidence"
      : adaptive.confidence === "medium"
        ? "Moderate confidence"
        : "Early estimate";

  return (
    <div className="rounded-xl border border-forge-ember/25 bg-forge-ember/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-semibold text-forge-text">
            3. Your metabolism (from logs)
          </p>
          <p className="mt-1 text-xs text-forge-muted">
            Based on {adaptive.daysLogged} logged days and {adaptive.weighIns}{" "}
            weigh-ins over {adaptive.weightSpanDays} days.
          </p>
        </div>
        <EvidenceExplainerLink
          href={buildEvidenceHref({ focus: "energy_balance_projection" })}
          label="How this works"
        />
      </div>

      <p className="mt-4 font-display text-3xl font-bold text-forge-ember">
        ~{adaptive.estimatedTdeeKcal.toLocaleString()}{" "}
        <span className="text-lg font-semibold text-forge-muted">kcal/day</span>
      </p>
      <p className="mt-1 text-sm text-forge-muted">
        Likely range: {low.toLocaleString()}–{high.toLocaleString()} kcal ·{" "}
        {confidenceLabel}
      </p>

      <div className="mt-4 rounded-lg bg-forge-surface/80 p-3 text-xs text-forge-muted">
        <p>
          You averaged{" "}
          <span className="font-semibold text-forge-text">
            {adaptive.avgIntakeKcal.toLocaleString()} kcal
          </span>{" "}
          on days you logged food.
          {adaptive.weightChangeKg !== 0 && (
            <>
              {" "}
              Weight{" "}
              {adaptive.weightChangeKg < 0 ? "down" : "up"}{" "}
              {Math.abs(adaptive.weightChangeKg)} kg over the period — that
              implies maintenance is near the number above.
            </>
          )}
          {adaptive.weightChangeKg === 0 && (
            <> Weight held steady — intake is close to your maintenance.</>
          )}
        </p>
        <p className="mt-2">
          This is an observation from your data, not a new target. Your program
          target still follows evidence-based rules; use this to sanity-check
          whether the plan fits your real life.
        </p>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-forge-surface-raised px-3 py-2.5">
      <p className="text-xs font-medium text-forge-muted">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold text-forge-text">
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-forge-muted">{hint}</p>}
    </div>
  );
}
