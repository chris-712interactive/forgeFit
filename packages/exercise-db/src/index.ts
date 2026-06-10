import { isExerciseAvailable } from "./availability";
import { EXERCISES } from "./exercises";
import type { Exercise, ExerciseDifficulty, MovementPattern } from "./types";

export type {
  CatalogExercise,
  Exercise,
  ExerciseDifficulty,
  MovementPattern,
} from "./types";
export { EXERCISES };
export {
  EXERCISE_IMAGE_BASE,
  exerciseImageUrl,
  getCatalog,
  getCatalogExerciseById,
  searchCatalog,
} from "./catalog";
export {
  getSubstitutions,
  getUnavailableReason,
} from "./substitutions";
export { resolveExerciseDetail } from "./resolve";
export { isExerciseAvailable } from "./availability";
export {
  CARDIO_EQUIPMENT_TYPES,
  expandUserEquipment,
  hasCardioEquipment,
  type CardioEquipmentType,
} from "./equipment";
export { pickCardioExercise, type CardioPrescription } from "./cardio";
export {
  sanitizeHighlighterMuscles,
  toHighlighterMuscles,
  VALID_HIGHLIGHTER_MUSCLES,
} from "./muscle-map";

const DIFFICULTY_RANK: Record<ExerciseDifficulty, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export function getExercises(): Exercise[] {
  return EXERCISES;
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
