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

/**
 * Stationary supports that must all be present when listed (AND).
 * Load modalities on an exercise are alternatives (OR).
 */
const SUPPORT_EQUIPMENT = new Set(["bench", "squat_rack"]);

/** User selected bodyweight only with no other strength equipment. */
export function isBodyweightOnlyMode(userEquipment: string[]): boolean {
  const gear = new Set(expandUserEquipment(userEquipment));
  if (!gear.has("bodyweight_only")) return false;
  return !NON_BODYWEIGHT_STRENGTH.some((item) => gear.has(item));
}

/**
 * Whether the user can perform the exercise with their declared equipment.
 * - Bodyweight-only mode: any listed equipment option may satisfy (OR).
 * - Otherwise: load modalities (barbell/dumbbells/…) are alternatives (OR);
 *   supports (bench, squat_rack) are required (AND).
 * - Bodyweight movements are always available — you always have your body —
 *   even if the user did not tick "Bodyweight Only" alongside gym gear.
 */
export function isExerciseAvailable(
  exercise: Exercise,
  userEquipment: string[]
): boolean {
  const gear = new Set(expandUserEquipment(userEquipment));
  // Implicit bodyweight access for push-ups, planks, BW squats, etc.
  gear.add("bodyweight_only");

  if (isBodyweightOnlyMode(userEquipment)) {
    return exercise.equipment.some((item) => gear.has(item));
  }

  const supports = exercise.equipment.filter((item) =>
    SUPPORT_EQUIPMENT.has(item)
  );
  const modalities = exercise.equipment.filter(
    (item) => !SUPPORT_EQUIPMENT.has(item)
  );

  if (!supports.every((item) => gear.has(item))) {
    return false;
  }

  if (modalities.length === 0) {
    return supports.length > 0;
  }

  return modalities.some((item) => gear.has(item));
}
