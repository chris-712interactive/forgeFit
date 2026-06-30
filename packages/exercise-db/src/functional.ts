import type { Exercise, MovementPattern } from "./types";

/** Multi-joint patterns that build transferable strength and joint resilience. */
export const FUNCTIONAL_PATTERNS: MovementPattern[] = [
  "squat",
  "hinge",
  "horizontal_push",
  "horizontal_pull",
  "vertical_push",
  "vertical_pull",
  "lunge",
  "carry",
];

const FREE_WEIGHT_EQUIPMENT = new Set([
  "barbell",
  "dumbbells",
  "kettlebells",
  "bodyweight_only",
  "pull_up_bar",
]);

export type FunctionalBias = "high" | "moderate" | "low";

export function isFunctionalPattern(pattern: MovementPattern): boolean {
  return FUNCTIONAL_PATTERNS.includes(pattern);
}

function isMachineOnly(exercise: Exercise): boolean {
  return exercise.equipment.length > 0 && exercise.equipment.every((item) => item === "machines");
}

function usesFreeWeights(exercise: Exercise): boolean {
  return exercise.equipment.some((item) => FREE_WEIGHT_EQUIPMENT.has(item));
}

/** Rank candidates for pickExerciseForPattern — higher is preferred. */
export function scoreExerciseForPick(
  exercise: Exercise,
  functionalBias: FunctionalBias
): number {
  let score = exercise.priority;

  if (functionalBias === "low") {
    return score;
  }

  if (isFunctionalPattern(exercise.movementPattern)) {
    score += functionalBias === "high" ? 3 : 2;
  }

  if (usesFreeWeights(exercise)) {
    score += functionalBias === "high" ? 2 : 1;
  }

  if (isMachineOnly(exercise)) {
    score -= functionalBias === "high" ? 3 : 2;
  }

  return score;
}
