import { isFunctionalPattern, type FunctionalBias, type MovementPattern } from "@forgefit/exercise-db";
import type { FitnessGoal } from "./types";

export function functionalBiasForGoal(
  goal: FitnessGoal,
  pattern: MovementPattern
): FunctionalBias {
  if (!isFunctionalPattern(pattern)) {
    return "low";
  }

  switch (goal) {
    case "bodybuilding":
      return "moderate";
    case "powerlifting":
    case "general_strength":
    case "sport_performance":
    case "recomposition":
    case "fat_loss":
      return "high";
    default:
      return "moderate";
  }
}

export function minCompoundExercisesForGoal(goal: FitnessGoal): number {
  switch (goal) {
    case "bodybuilding":
      return 2;
    case "powerlifting":
    case "general_strength":
    case "sport_performance":
      return 3;
    case "recomposition":
    case "fat_loss":
      return 2;
    default:
      return 2;
  }
}

/** Patterns tried when a session falls below the compound floor. */
export const COMPOUND_FLOOR_PATTERNS: MovementPattern[] = [
  "squat",
  "hinge",
  "horizontal_push",
  "horizontal_pull",
  "vertical_push",
  "vertical_pull",
  "lunge",
];

export function fillerPatternsForGoal(
  goal: FitnessGoal,
  templatePatterns: MovementPattern[]
): MovementPattern[] {
  const isolationFillers: MovementPattern[] = (
    ["core", "isolation_arms", "isolation_legs"] as const
  ).filter((pattern) => !templatePatterns.includes(pattern));

  if (goal === "bodybuilding") {
    return isolationFillers;
  }

  const compoundFillers = COMPOUND_FLOOR_PATTERNS.filter(
    (pattern) => !templatePatterns.includes(pattern)
  );

  return [...compoundFillers, ...isolationFillers];
}
