import type { ProgramPlan } from "@forgefit/program-engine";
import { toScheduleStartIso } from "@forgefit/program-engine";
import type { DailyNutritionSummary } from "@/lib/nutrition/types";
import { sessionMatchesScheduledPlanDay } from "@/lib/workouts/schedule-dates";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import { findNextPlannedSession, isEffectiveTrainingDay } from "@/lib/workouts/next-session";
import {
  effectiveScheduledDateIso,
  type WorkoutScheduleOverride,
} from "@/lib/workouts/schedule-overrides";
import type { WeeklyWorkStats } from "./types";

export type HomeHeroStatus =
  | "no_plan"
  | "week_complete"
  | "rest"
  | "in_progress"
  | "planned";

export interface HomeHeroContext {
  status: HomeHeroStatus;
  sessionDayIndex: number | null;
  sessionName: string | null;
  exerciseCount: number | null;
  estimatedMinutes: number | null;
  setsCompleted: number | null;
  setsTotal: number | null;
  fuelHint: string | null;
}

function buildFuelHint(
  plan: ProgramPlan,
  stats: WeeklyWorkStats,
  nutrition: DailyNutritionSummary,
  overrides: WorkoutScheduleOverride[] = [],
  referenceDate = new Date()
): string | null {
  const proteinTarget = nutrition.targets?.proteinG ?? 0;
  const proteinLogged = Math.round(nutrition.totals.proteinG);
  const proteinLeft =
    proteinTarget > 0
      ? Math.max(0, Math.round(proteinTarget - proteinLogged))
      : 0;

  if (proteinTarget <= 0) return null;
  if (proteinLeft === 0) {
    return "Protein target hit for today — nice work.";
  }

  const isTrainingDay = isEffectiveTrainingDay(plan, referenceDate, overrides);

  if (isTrainingDay) {
    return `Training day — about ${proteinLeft}g protein left to fuel recovery.`;
  }
  if (stats.workoutsCompleted < stats.workoutsPlanned) {
    return `${proteinLeft}g protein left today — keep meals aligned with this week's plan.`;
  }
  return `${proteinLeft}g protein left today.`;
}

export function buildHomeHeroContext(
  plan: ProgramPlan | null,
  sessions: WorkoutSessionRecord[],
  stats: WeeklyWorkStats,
  nutrition: DailyNutritionSummary,
  referenceDate = new Date(),
  overrides: WorkoutScheduleOverride[] = []
): HomeHeroContext {
  if (!plan) {
    return {
      status: "no_plan",
      sessionDayIndex: null,
      sessionName: null,
      exerciseCount: null,
      estimatedMinutes: null,
      setsCompleted: null,
      setsTotal: null,
      fuelHint: null,
    };
  }

  const fuelHint = buildFuelHint(plan, stats, nutrition, overrides, referenceDate);

  const inProgress = sessions.find(
    (session) =>
      session.status === "in_progress" &&
      sessionMatchesScheduledPlanDay(
        session,
        session.dayIndex,
        plan,
        referenceDate
      )
  );

  if (inProgress) {
    const planSession = plan.week.find(
      (session) => session.dayIndex === inProgress.dayIndex
    );
    const setsCompleted = inProgress.sets.filter((set) => set.completed).length;
    const setsTotal = inProgress.sets.length;

    return {
      status: "in_progress",
      sessionDayIndex: inProgress.dayIndex,
      sessionName: inProgress.sessionName,
      exerciseCount: planSession?.exercises.length ?? null,
      estimatedMinutes: planSession?.estimatedMinutes ?? null,
      setsCompleted,
      setsTotal,
      fuelHint,
    };
  }

  const next = findNextPlannedSession(
    sessions,
    plan,
    referenceDate,
    overrides
  );
  if (!next) {
    return {
      status: "week_complete",
      sessionDayIndex: null,
      sessionName: null,
      exerciseCount: null,
      estimatedMinutes: null,
      setsCompleted: null,
      setsTotal: null,
      fuelHint,
    };
  }

  const planSession = plan.week.find(
    (session) => session.dayIndex === next.dayIndex
  );
  const todayIso = toScheduleStartIso(referenceDate);
  const nextEffectiveIso = effectiveScheduledDateIso(
    next.dayIndex,
    plan,
    overrides,
    referenceDate
  );
  const isToday = nextEffectiveIso === todayIso;

  return {
    status: isToday ? "planned" : "rest",
    sessionDayIndex: next.dayIndex,
    sessionName: next.name,
    exerciseCount: planSession?.exercises.length ?? null,
    estimatedMinutes: planSession?.estimatedMinutes ?? null,
    setsCompleted: null,
    setsTotal: null,
    fuelHint,
  };
}
