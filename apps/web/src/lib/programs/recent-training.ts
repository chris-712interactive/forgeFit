import { getExerciseById } from "@forgefit/exercise-db";
import {
  isoWeekdayFromDate,
  sessionKind,
  toScheduleStartIso,
  type ProgramPlan,
  type RecentTrainingContext,
} from "@forgefit/program-engine";
import { planScheduleStartIso } from "@/lib/programs/start-date";
import {
  sessionDateIso,
  sessionMatchesScheduledPlanDay,
} from "@/lib/workouts/schedule-dates";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";

function pushUnique(target: string[], value: string): void {
  if (!target.includes(value)) {
    target.push(value);
  }
}

/** Completed session kind from the calendar day before plan start (most common regenerate case). */
export function findYesterdayCompletedSessionKind(
  records: WorkoutSessionRecord[],
  startDate: Date
): string | undefined {
  const yesterday = new Date(startDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = toScheduleStartIso(yesterday);

  let best: { when: number; kind: string } | undefined;

  for (const record of records) {
    if (record.status !== "completed") continue;
    if (sessionDateIso(record) !== yesterdayIso) continue;

    const when = new Date(record.completedAt ?? record.startedAt).getTime();
    if (!best || when > best.when) {
      best = { when, kind: sessionKind(record.sessionName) };
    }
  }

  return best?.kind;
}

/** Most recent completed session kind before regenerate — calendar-based, not plan-slot matching. */
export function findMostRecentCompletedSessionKind(
  records: WorkoutSessionRecord[],
  startDate: Date,
  maxLookbackDays = 14
): string | undefined {
  const startIso = toScheduleStartIso(startDate);
  const minDate = new Date(startDate);
  minDate.setDate(minDate.getDate() - maxLookbackDays);
  const minIso = toScheduleStartIso(minDate);

  let best: { when: number; kind: string } | undefined;

  for (const record of records) {
    if (record.status !== "completed") continue;

    const dateIso = sessionDateIso(record);
    if (dateIso >= startIso) continue;
    if (dateIso < minIso) continue;

    const when = new Date(record.completedAt ?? record.startedAt).getTime();
    if (!best || when > best.when) {
      best = { when, kind: sessionKind(record.sessionName) };
    }
  }

  return best?.kind;
}

export function resolveLastSessionKindForRegenerate(
  records: WorkoutSessionRecord[],
  startDate: Date
): string | undefined {
  return (
    findYesterdayCompletedSessionKind(records, startDate) ??
    findMostRecentCompletedSessionKind(records, startDate)
  );
}

/** Infer what to avoid today from the prior plan schedule (no workout log required). */
export function inferAvoidKindFromPriorPlan(
  priorPlan: ProgramPlan,
  startDate: Date
): string | undefined {
  const startWeekday = isoWeekdayFromDate(startDate);

  const yesterday = new Date(startDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayWeekday = isoWeekdayFromDate(yesterday);
  const yesterdaySlot = priorPlan.week.find(
    (session) => session.dayIndex === yesterdayWeekday
  );
  if (yesterdaySlot) {
    return sessionKind(yesterdaySlot.name);
  }

  const lastSlotBeforeToday = [...priorPlan.week]
    .filter((session) => session.dayIndex < startWeekday)
    .sort((a, b) => b.dayIndex - a.dayIndex)[0];
  if (lastSlotBeforeToday) {
    return sessionKind(lastSlotBeforeToday.name);
  }

  return undefined;
}

export function resolveAvoidSessionKindForRegenerate(
  records: WorkoutSessionRecord[],
  priorPlan: ProgramPlan,
  startDate: Date,
  override?: string
): string | undefined {
  return (
    override ??
    findYesterdayCompletedSessionKind(records, startDate) ??
    findMostRecentCompletedSessionKind(records, startDate) ??
    inferAvoidKindFromPriorPlan(priorPlan, startDate)
  );
}

/** Collect exercises and muscles from completed sessions before a regenerate start date. */
export function buildRecentTrainingContextFromSessions(
  records: WorkoutSessionRecord[],
  priorPlan: ProgramPlan,
  startDate: Date,
  referenceDate = new Date(),
  lastSessionKindOverride?: string
): RecentTrainingContext {
  const startIso = toScheduleStartIso(startDate);
  const exerciseIds: string[] = [];
  const muscleGroups: string[] = [];
  const lastSessionKind = resolveAvoidSessionKindForRegenerate(
    records,
    priorPlan,
    startDate,
    lastSessionKindOverride
  );

  for (const record of records) {
    if (record.status !== "completed") continue;
    if (!sessionMatchesScheduledPlanDay(record, record.dayIndex, priorPlan, referenceDate)) {
      continue;
    }
    if (sessionDateIso(record) >= startIso) continue;

    const completedExerciseIds = [
      ...new Set(
        record.sets
          .filter((set) => set.completed)
          .map((set) => set.exerciseId)
      ),
    ];

    for (const exerciseId of completedExerciseIds) {
      pushUnique(exerciseIds, exerciseId);
      const catalog = getExerciseById(exerciseId);
      if (!catalog) continue;
      for (const muscle of catalog.primaryMuscles) {
        pushUnique(muscleGroups, muscle);
      }
    }
  }

  return { exerciseIds, muscleGroups, lastSessionKind };
}

export function planReferenceDateForRecentTraining(
  priorPlan: ProgramPlan,
  startDate: Date
): Date {
  const planStartIso = planScheduleStartIso(priorPlan);
  const startIso = toScheduleStartIso(startDate);
  if (planStartIso <= startIso) {
    return startDate;
  }
  return new Date(`${planStartIso}T12:00:00`);
}
