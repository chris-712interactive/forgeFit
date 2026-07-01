import {
  expandUserEquipment,
  pickExerciseForPattern,
  type ExerciseDifficulty,
  type MovementPattern,
} from "@forgefit/exercise-db";
import type { EvidenceRule } from "@forgefit/evidence-kb";
import { getRecommendationValue } from "@forgefit/evidence-kb";
import type {
  ConditioningBlock,
  ConditioningMovement,
  ExperienceLevel,
  ProgramUserProfile,
} from "./types";
import type { WeekExerciseMemory } from "./recent-training";

const DEFAULT_CONDITIONING_PATTERNS: MovementPattern[] = [
  "squat",
  "horizontal_push",
  "hinge",
  "core",
  "carry",
];

function maxDifficulty(experience: ExperienceLevel): ExerciseDifficulty {
  switch (experience) {
    case "beginner":
      return "beginner";
    case "intermediate":
      return "intermediate";
    default:
      return "advanced";
  }
}

export function conditioningRoundsForSession(
  minutesPerSession: number,
  experience: ExperienceLevel,
  rules: EvidenceRule[]
): number {
  const fromRules = getRecommendationValue<number>(
    rules,
    "conditioning_rounds",
    "optimal"
  );
  if (fromRules != null) return fromRules;

  if (experience === "beginner") {
    if (minutesPerSession <= 30) return 3;
    if (minutesPerSession <= 45) return 3;
    return 4;
  }
  if (minutesPerSession <= 30) return 3;
  if (minutesPerSession <= 45) return 4;
  if (minutesPerSession <= 60) return 5;
  return 6;
}

function prescriptionForPattern(
  pattern: MovementPattern,
  experience: ExperienceLevel
): string {
  if (pattern === "carry") return "40m";
  if (pattern === "cardio") return "30 sec";
  return experience === "beginner" ? "10 reps" : "12 reps";
}

export function buildConditioningBlock(
  sessionName: string,
  patterns: MovementPattern[],
  profile: ProgramUserProfile,
  rules: EvidenceRule[],
  memory?: WeekExerciseMemory
): ConditioningBlock {
  const equipment = expandUserEquipment(profile.equipment);
  const usedIds = [...(memory?.usedExerciseIds ?? [])];
  const recentMuscleGroups = [...(memory?.recentMuscleGroups ?? [])];
  const movements: ConditioningMovement[] = [];
  const patternQueue =
    patterns.length >= 3 ? patterns.slice(0, 5) : DEFAULT_CONDITIONING_PATTERNS;

  for (const pattern of patternQueue) {
    if (movements.length >= 5) break;
    const picked = pickExerciseForPattern(
      pattern,
      equipment,
      maxDifficulty(profile.experience),
      usedIds,
      { functionalBias: "high", recentMuscleGroups }
    );
    if (!picked) continue;
    usedIds.push(picked.id);
    movements.push({
      exerciseId: picked.id,
      name: picked.name,
      prescription: prescriptionForPattern(pattern, profile.experience),
    });
  }

  const rounds = conditioningRoundsForSession(
    profile.minutesPerSession,
    profile.experience,
    rules
  );
  const restBetweenRoundsSeconds =
    profile.experience === "beginner"
      ? 90
      : getRecommendationValue<number>(
          rules,
          "conditioning_rest_seconds",
          "optimal"
        ) ?? 60;

  return {
    name: sessionName,
    format: "fixed_rounds",
    rounds,
    timeCapMinutes: Math.max(12, profile.minutesPerSession - 8),
    restBetweenRoundsSeconds,
    movements,
    notes:
      "Complete all movements each round. Rest between rounds, then start the next round.",
  };
}
