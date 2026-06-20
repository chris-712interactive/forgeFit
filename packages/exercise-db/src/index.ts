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
export { isExerciseAvailable, isBodyweightOnlyMode } from "./availability";
export {
  exerciseTracksWeight,
  isBodyweightOnlyExercise,
} from "./tracking";
export {
  CARDIO_EQUIPMENT_TYPES,
  expandUserEquipment,
  hasCardioEquipment,
  type CardioEquipmentType,
} from "./equipment";
export { pickCardioExercise, type CardioPrescription } from "./cardio";
export {
  holdDurationPrescription,
  isDurationHoldExercise,
  isTimedCardioExercise,
  isTimedExercise,
  parseTimedTargetValue,
  resolveHoldPrescription,
  resolveTimedPrescription,
  formatTimedDuration,
  formatTimedDurationFromMs,
  timedDurationFromElapsed,
  timedDurationPartsFromMs,
  timedLogValueFromElapsed,
  timedLogValueFromTimer,
  timedMsFromElapsedSeconds,
  timedMsFromParts,
  timedSetFieldsFromElapsed,
  timedSetTotalMs,
  timedSetTotalSeconds,
  type TimedDurationParts,
  timedPrescriptionUnit,
  timedTargetSeconds,
  type HoldExperience,
  type TimedPrescriptionUnit,
} from "./holds";
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
