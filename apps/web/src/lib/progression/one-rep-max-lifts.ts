import { resolveExerciseDetail } from "@forgefit/exercise-db";

/** Featured compound lifts — shown first in profile and analytics tabs. */
export const ONE_REP_MAX_LIFTS = [
  { exerciseId: "barbell_squat", label: "Back Squat" },
  { exerciseId: "barbell_bench", label: "Bench Press" },
  { exerciseId: "barbell_deadlift", label: "Deadlift" },
  { exerciseId: "overhead_press", label: "Overhead Press" },
  { exerciseId: "romanian_deadlift", label: "Romanian Deadlift" },
  { exerciseId: "barbell_row", label: "Barbell Row" },
  { exerciseId: "goblet_squat", label: "Goblet Squat" },
  { exerciseId: "leg_press", label: "Leg Press" },
] as const;

export type OneRepMaxLiftId = (typeof ONE_REP_MAX_LIFTS)[number]["exerciseId"];

export const ONE_REP_MAX_EXERCISE_IDS = ONE_REP_MAX_LIFTS.map(
  (lift) => lift.exerciseId
);

const FEATURED_LABELS = new Map(
  ONE_REP_MAX_LIFTS.map((lift) => [lift.exerciseId, lift.label])
);

export function resolveOneRepMaxLabel(
  exerciseId: string,
  fallback?: string
): string {
  return (
    FEATURED_LABELS.get(exerciseId as (typeof ONE_REP_MAX_LIFTS)[number]["exerciseId"]) ??
    resolveExerciseDetail(exerciseId)?.name ??
    fallback ??
    exerciseId
  );
}

export function isFeaturedOneRepMaxLift(exerciseId: string): boolean {
  return FEATURED_LABELS.has(exerciseId as never);
}
