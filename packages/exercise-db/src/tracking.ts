import { isTimedExercise } from "./holds";
import { resolveExerciseDetail } from "./resolve";

/** Exercises that use bodyweight only — no external load to log. */
export function isBodyweightOnlyExercise(exerciseId: string): boolean {
  const detail = resolveExerciseDetail(exerciseId);
  if (!detail) return false;
  const equipment = new Set(detail.equipment);
  return (
    equipment.has("bodyweight_only") &&
    !equipment.has("dumbbells") &&
    !equipment.has("barbell") &&
    !equipment.has("kettlebells") &&
    !equipment.has("cables") &&
    !equipment.has("machines")
  );
}

/** Single implement held with both hands — log total weight, not per hand. */
const SINGLE_IMPLEMENT_EXERCISE_IDS = new Set(["goblet_squat"]);

/**
 * Whether logged weight is one dumbbell (each hand), not the combined pair.
 * Used for bilateral and unilateral dumbbell lifts; excludes goblet-style holds.
 */
export function exerciseLogsPerDumbbell(exerciseId: string): boolean {
  if (!exerciseTracksWeight(exerciseId)) return false;
  if (SINGLE_IMPLEMENT_EXERCISE_IDS.has(exerciseId)) return false;

  const detail = resolveExerciseDetail(exerciseId);
  if (!detail) return false;

  const equipment = new Set(detail.equipment);
  if (!equipment.has("dumbbells")) return false;

  // Dual-modality lifts (e.g. barbell or dumbbells) log total bar weight on the bar.
  if (equipment.has("barbell") && !exerciseId.includes("dumbbell")) {
    return false;
  }

  return true;
}

/** Whether the workout logger should show a weight field for this exercise. */
export function exerciseTracksWeight(exerciseId: string): boolean {
  if (isTimedExercise(exerciseId)) return false;
  if (isBodyweightOnlyExercise(exerciseId)) return false;

  const detail = resolveExerciseDetail(exerciseId);
  if (!detail) return true;

  const equipment = new Set(detail.equipment);
  if (equipment.has("resistance_bands") && equipment.size === 1) {
    return false;
  }

  return true;
}
