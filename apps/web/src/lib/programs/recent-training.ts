import { getExerciseById } from "@forgefit/exercise-db";
import {
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

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Most recent completed session kind before regenerate — calendar-based, not plan-slot matching. */
export function findMostRecentCompletedSessionKind(
  records: WorkoutSessionRecord[],
  startDate: Date,
  maxLookbackDays = 14
): string | undefined {
  const startMs = startOfDay(startDate).getTime();
  const minMs = startMs - maxLookbackDays * 86_400_000;

  let best: { when: number; kind: string } | undefined;

  for (const record of records) {
    if (record.status !== "completed") continue;

    const when = new Date(record.completedAt ?? record.startedAt).getTime();
    if (when >= startMs) continue;
    if (when < minMs) continue;

    if (!best || when > best.when) {
      best = { when, kind: sessionKind(record.sessionName) };
    }
  }

  return best?.kind;
}

/** Collect exercises and muscles from completed sessions before a regenerate start date. */
export function buildRecentTrainingContextFromSessions(
  records: WorkoutSessionRecord[],
  priorPlan: ProgramPlan,
  startDate: Date,
  referenceDate = new Date()
): RecentTrainingContext {
  const startIso = toScheduleStartIso(startDate);
  const exerciseIds: string[] = [];
  const muscleGroups: string[] = [];
  const lastSessionKind = findMostRecentCompletedSessionKind(records, startDate);

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

/** True when prior plan has schedule metadata worth matching against. */
export function priorPlanSupportsRecentTraining(
  priorPlan: ProgramPlan | null
): priorPlan is ProgramPlan {
  if (!priorPlan) return false;
  return Boolean(priorPlan.scheduleStartDate ?? priorPlan.generatedAt);
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
