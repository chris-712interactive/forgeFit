import type { ProgramPlan } from "@forgefit/program-engine";
import { isoWeekdayFromDate } from "@forgefit/program-engine";
import { buildNutritionHref } from "@/lib/nutrition/date-param";
import type { DailyNutritionSummary } from "@/lib/nutrition/types";
import type { WeeklyWorkStats } from "@/lib/home/types";
import Link from "next/link";

interface HomeIntegratedLoopProps {
  plan: ProgramPlan;
  stats: WeeklyWorkStats;
  nutrition: DailyNutritionSummary;
  nextSessionDayIndex: number | null;
  nextSessionName: string | null;
}

function progressPct(current: number, target: number): number {
  if (target <= 0) return current > 0 ? 100 : 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function HomeIntegratedLoop({
  plan,
  stats,
  nutrition,
  nextSessionDayIndex,
  nextSessionName,
}: HomeIntegratedLoopProps) {
  const workoutPct = progressPct(
    stats.workoutsCompleted,
    stats.workoutsPlanned
  );

  const proteinTarget = nutrition.targets?.proteinG ?? 0;
  const proteinLogged = Math.round(nutrition.totals.proteinG);
  const proteinPct = progressPct(proteinLogged, proteinTarget);
  const proteinLeft =
    proteinTarget > 0 ? Math.max(0, Math.round(proteinTarget - proteinLogged)) : 0;

  const calorieTarget = nutrition.targets?.calories ?? 0;
  const calorieLogged = Math.round(nutrition.totals.calories);
  const caloriePct = progressPct(calorieLogged, calorieTarget);
  const caloriesLeft =
    calorieTarget > 0 ? Math.max(0, Math.round(calorieTarget - calorieLogged)) : 0;

  const todayIndex = isoWeekdayFromDate(new Date());
  const isTrainingDay = plan.week.some(
    (session) => session.dayIndex === todayIndex
  );

  const fuelHint = (() => {
    if (proteinTarget <= 0) return null;
    if (proteinLeft === 0) {
      return "Protein target hit for today — nice work.";
    }
    if (isTrainingDay) {
      return `Training day — about ${proteinLeft}g protein left to fuel recovery.`;
    }
    if (stats.workoutsCompleted < stats.workoutsPlanned) {
      return `${proteinLeft}g protein left today — keep meals aligned with this week's plan.`;
    }
    return `${proteinLeft}g protein left today.`;
  })();

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Train &amp; fuel
        </h2>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <Link
            href="/workout"
            className="text-forge-steel hover:text-forge-ember"
          >
            Workout →
          </Link>
          <Link
            href={buildNutritionHref({ tab: "diary" })}
            className="text-forge-steel hover:text-forge-ember"
          >
            Diary →
          </Link>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <LoopMetricRow
          label="Workouts this week"
          currentLabel={`${stats.workoutsCompleted}/${stats.workoutsPlanned || "—"}`}
          pct={workoutPct}
          barClassName="bg-forge-gold"
          detail={`${workoutPct}% of planned sessions`}
        />

        <LoopMetricRow
          label="Protein today"
          currentLabel={
            proteinTarget > 0
              ? `${proteinLogged}/${Math.round(proteinTarget)}g`
              : `${proteinLogged}g`
          }
          pct={proteinPct}
          barClassName="bg-forge-coral"
          detail={
            proteinLeft > 0 ? `${proteinLeft}g left` : "Target reached"
          }
        />

        {calorieTarget > 0 && (
          <LoopMetricRow
            label="Calories today"
            currentLabel={`${calorieLogged.toLocaleString()}/${calorieTarget.toLocaleString()}`}
            pct={caloriePct}
            barClassName="bg-forge-ember"
            detail={
              caloriesLeft > 0
                ? `${caloriesLeft.toLocaleString()} kcal left`
                : "At target"
            }
          />
        )}
      </div>

      {fuelHint && (
        <p className="mt-4 text-sm leading-relaxed text-forge-muted">{fuelHint}</p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {nextSessionName && nextSessionDayIndex != null && (
          <Link
            href={`/workout?day=${nextSessionDayIndex}`}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white"
          >
            {stats.workoutsCompleted > 0 ? "Continue" : "Start"}{" "}
            {nextSessionName}
          </Link>
        )}
        {proteinLeft > 0 && (
          <Link
            href={buildNutritionHref({ tab: "diary" })}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-forge-coral/40 font-display text-sm font-semibold text-forge-coral"
          >
            Log food
          </Link>
        )}
      </div>
    </section>
  );
}

function LoopMetricRow({
  label,
  currentLabel,
  pct,
  barClassName,
  detail,
}: {
  label: string;
  currentLabel: string;
  pct: number;
  barClassName: string;
  detail: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-forge-text">{label}</p>
        <p className="font-display text-sm font-semibold tabular-nums text-forge-text">
          {currentLabel}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-forge-surface">
        <div
          className={`h-full rounded-full transition-all ${barClassName}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-forge-muted">{detail}</p>
    </div>
  );
}
