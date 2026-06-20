import { expandUserEquipment } from "./equipment";
import type { Exercise } from "./types";

/** Strength gear beyond bodyweight — used to detect bodyweight-only mode. */
const NON_BODYWEIGHT_STRENGTH = [
  "barbell",
  "dumbbells",
  "kettlebells",
  "cables",
  "machines",
  "bench",
  "squat_rack",
  "pull_up_bar",
  "resistance_bands",
] as const;

/** User selected bodyweight only with no other strength equipment. */
export function isBodyweightOnlyMode(userEquipment: string[]): boolean {
  const gear = new Set(expandUserEquipment(userEquipment));
  if (!gear.has("bodyweight_only")) return false;
  return !NON_BODYWEIGHT_STRENGTH.some((item) => gear.has(item));
}

/**
 * Whether the user can perform the exercise with their declared equipment.
 * - Bodyweight-only mode: any listed equipment option may satisfy (OR).
 * - Otherwise: every listed item must be present (AND), except exercises that
 *   list alternatives like barbell OR dumbbells — satisfied if any option matches.
 */
export function isExerciseAvailable(
  exercise: Exercise,
  userEquipment: string[]
): boolean {
  const gear = new Set(expandUserEquipment(userEquipment));

  if (isBodyweightOnlyMode(userEquipment)) {
    return exercise.equipment.some((item) => gear.has(item));
  }

  return exercise.equipment.every((item) => gear.has(item));
}
