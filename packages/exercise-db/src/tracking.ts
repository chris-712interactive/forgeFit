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
