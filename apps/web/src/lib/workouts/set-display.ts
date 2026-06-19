import {
  exerciseTracksWeight,
  formatTimedDurationFromMs,
  isTimedExercise,
  timedSetTotalMs,
} from "@forgefit/exercise-db";
import { formatWeight } from "@/lib/units/measurements";
import type { UnitSystem } from "@/lib/types/profile";

interface LoggedSetFields {
  reps?: number | null;
  weightKg?: number | null;
  durationMs?: number | null;
  completed?: boolean;
}

/** User-facing label for a logged set in recap/history views. */
export function formatLoggedSetValue(
  set: LoggedSetFields,
  exerciseId: string,
  unit: UnitSystem
): string | null {
  if (!set.completed) return null;

  if (isTimedExercise(exerciseId)) {
    const ms = timedSetTotalMs(
      {
        reps: set.reps ?? undefined,
        durationMs: set.durationMs ?? undefined,
      },
      exerciseId
    );
    return ms != null ? formatTimedDurationFromMs(exerciseId, ms) : null;
  }

  if (set.reps == null) return null;

  if (exerciseTracksWeight(exerciseId)) {
    if (set.weightKg == null) return null;
    return `${formatWeight(set.weightKg, unit)} × ${set.reps}`;
  }

  return `${set.reps} reps`;
}

/** Whether a set has enough data to display in recap/history. */
export function isSetLogComplete(
  set: LoggedSetFields,
  exerciseId: string
): boolean {
  if (!set.completed) return false;
  return formatLoggedSetValue(set, exerciseId, "metric") != null;
}
