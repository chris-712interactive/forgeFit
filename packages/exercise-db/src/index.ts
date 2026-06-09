import { EXERCISES } from "./exercises";
import type { Exercise, ExerciseDifficulty, MovementPattern } from "./types";

export type { Exercise, MovementPattern, ExerciseDifficulty } from "./types";
export { EXERCISES };

const DIFFICULTY_RANK: Record<ExerciseDifficulty, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export function getExercises(): Exercise[] {
  return EXERCISES;
}

/** User must have every piece of equipment the exercise requires. */
export function isExerciseAvailable(
  exercise: Exercise,
  userEquipment: string[]
): boolean {
  const gear = new Set(userEquipment);
  if (gear.has("bodyweight_only") && exercise.equipment.includes("bodyweight_only")) {
    return true;
  }
  return exercise.equipment.every((item) => gear.has(item));
}

export function pickExerciseForPattern(
  pattern: MovementPattern,
  userEquipment: string[],
  maxDifficulty: ExerciseDifficulty,
  excludeIds: string[] = []
): Exercise | undefined {
  const maxRank = DIFFICULTY_RANK[maxDifficulty];
  const candidates = EXERCISES.filter(
    (ex) =>
      ex.movementPattern === pattern &&
      !excludeIds.includes(ex.id) &&
      DIFFICULTY_RANK[ex.difficulty] <= maxRank &&
      isExerciseAvailable(ex, userEquipment)
  );

  if (candidates.length === 0) return undefined;

  return candidates.sort((a, b) => b.priority - a.priority)[0];
}
