import { exerciseLogsPerDumbbell } from "@forgefit/exercise-db";
import type { UnitSystem } from "../types/profile";
import { formatShortDate } from "./comparison";
import { formatLoggedSetValue } from "./set-display";
import type { WorkoutSessionRecord, WorkoutSetRecord } from "./sessions";

export interface LastLoggedSet {
  exerciseId: string;
  weightKg?: number;
  reps?: number;
  durationMs?: number;
  completedAt: string;
}

function sessionTime(session: WorkoutSessionRecord): string {
  return session.completedAt ?? session.startedAt;
}

function setMatchesExercise(
  set: WorkoutSetRecord,
  exerciseId: string,
  exerciseName?: string
): boolean {
  if (set.exerciseId === exerciseId || set.plannedExerciseId === exerciseId) {
    return true;
  }
  if (!exerciseName) return false;
  return set.exerciseName.trim().toLowerCase() === exerciseName.trim().toLowerCase();
}

function rankLoggedSet(set: WorkoutSetRecord): number {
  const weight = set.weightKg ?? 0;
  const reps = set.reps ?? 0;
  const duration = set.durationMs ?? 0;
  return weight * 1_000_000 + duration * 100 + reps;
}

function bestCompletedSet(
  sets: WorkoutSetRecord[],
  exerciseId: string,
  exerciseName?: string
): WorkoutSetRecord | null {
  const matches = sets.filter(
    (set) =>
      set.completed &&
      setMatchesExercise(set, exerciseId, exerciseName) &&
      formatLoggedSetValue(set, set.exerciseId || exerciseId, "metric") != null
  );
  if (matches.length === 0) return null;

  return matches.reduce((best, set) =>
    rankLoggedSet(set) > rankLoggedSet(best) ? set : best
  );
}

/** Most recent completed performance for this movement, excluding the current session. */
export function findLastLoggedSet(
  sessions: WorkoutSessionRecord[],
  exerciseId: string,
  options?: {
    excludeClientId?: string;
    exerciseName?: string;
  }
): LastLoggedSet | null {
  const history = [...sessions]
    .filter(
      (session) =>
        session.status === "completed" &&
        session.clientId !== options?.excludeClientId
    )
    .sort((a, b) => sessionTime(b).localeCompare(sessionTime(a)));

  for (const session of history) {
    const best = bestCompletedSet(
      session.sets,
      exerciseId,
      options?.exerciseName
    );
    if (!best) continue;

    return {
      exerciseId: best.exerciseId || exerciseId,
      weightKg: best.weightKg,
      reps: best.reps,
      durationMs: best.durationMs,
      completedAt: sessionTime(session),
    };
  }

  return null;
}

export function formatLastLoggedSetHint(
  last: LastLoggedSet,
  unit: UnitSystem
): string | null {
  const value = formatLoggedSetValue(
    {
      completed: true,
      weightKg: last.weightKg,
      reps: last.reps,
      durationMs: last.durationMs,
    },
    last.exerciseId,
    unit
  );
  if (!value) return null;

  const perDumbbell = exerciseLogsPerDumbbell(last.exerciseId)
    ? " per dumbbell"
    : "";
  const when = formatShortDate(last.completedAt);
  return `Last time (${when}): ${value}${perDumbbell}`;
}
