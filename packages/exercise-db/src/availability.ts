import type { Exercise } from "./types";

/** User must have every piece of equipment the exercise requires. */
export function isExerciseAvailable(
  exercise: Exercise,
  userEquipment: string[]
): boolean {
  const gear = new Set(userEquipment);
  if (
    gear.has("bodyweight_only") &&
    exercise.equipment.includes("bodyweight_only")
  ) {
    return true;
  }
  return exercise.equipment.every((item) => gear.has(item));
}
