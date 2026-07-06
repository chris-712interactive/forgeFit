import {
  expandUserEquipment,
  pickExerciseForPattern,
  type ExerciseDifficulty,
  type MovementPattern,
} from "@forgefit/exercise-db";
import type { EvidenceRule } from "@forgefit/evidence-kb";
import { getRecommendationValue } from "@forgefit/evidence-kb";
import type { SessionTemplate } from "./splits";
import type {
  ConditioningBlock,
  ConditioningFormat,
  ConditioningMovement,
  ConditioningScope,
  ExperienceLevel,
  FitnessGoal,
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

const FINISHER_PATTERNS: MovementPattern[] = ["squat", "horizontal_push", "core"];

export interface BuildConditioningBlockOptions {
  format?: ConditioningFormat;
  scope?: ConditioningScope;
  movementCap?: number;
}

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

export function amrapTimeCapMinutes(
  profile: ProgramUserProfile,
  rules: EvidenceRule[],
  scope: ConditioningScope
): number {
  if (scope === "finisher") {
    return (
      getRecommendationValue<number>(
        rules,
        "conditioning_finisher_minutes",
        "optimal"
      ) ?? 5
    );
  }

  const fromRules = getRecommendationValue<number>(
    rules,
    "conditioning_amrap_minutes",
    "optimal"
  );
  if (fromRules != null) return fromRules;

  if (profile.experience === "beginner") return 10;
  if (profile.minutesPerSession <= 45) return 12;
  return 15;
}

export function shouldUseAmrapFormat(conditioningSessionIndex: number): boolean {
  return conditioningSessionIndex >= 1;
}

export function goalsEligibleForConditioningFinisher(
  goal: FitnessGoal
): boolean {
  return (
    goal === "general_strength" ||
    goal === "recomposition" ||
    goal === "bodybuilding" ||
    goal === "sport_performance"
  );
}

export function shouldAttachConditioningFinisher(
  profile: ProgramUserProfile,
  template: SessionTemplate,
  split: SessionTemplate[],
  templateIndex: number
): boolean {
  if (template.sessionType === "conditioning") return false;
  if (!goalsEligibleForConditioningFinisher(profile.goal)) return false;
  if (profile.minutesPerSession < 45) return false;
  if (profile.sessionsPerWeek < 3) return false;
  if (template.includeCardio) return false;

  const isLastStrengthSession = split
    .slice(templateIndex + 1)
    .every((entry) => entry.sessionType === "conditioning");

  return isLastStrengthSession;
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
  memory?: WeekExerciseMemory,
  options: BuildConditioningBlockOptions = {}
): ConditioningBlock {
  const scope = options.scope ?? "circuit";
  const format = options.format ?? "fixed_rounds";
  const movementCap = options.movementCap ?? (scope === "finisher" ? 3 : 5);
  const equipment = expandUserEquipment(profile.equipment);
  const usedIds = [...(memory?.usedExerciseIds ?? [])];
  const recentMuscleGroups = [...(memory?.recentMuscleGroups ?? [])];
  const movements: ConditioningMovement[] = [];
  const patternQueue =
    patterns.length >= 3 ? patterns.slice(0, movementCap) : DEFAULT_CONDITIONING_PATTERNS;

  for (const pattern of patternQueue) {
    if (movements.length >= movementCap) break;
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

  const timeCapMinutes = amrapTimeCapMinutes(profile, rules, scope);
  const restBetweenRoundsSeconds =
    scope === "finisher"
      ? 30
      : profile.experience === "beginner"
        ? 90
        : getRecommendationValue<number>(
            rules,
            "conditioning_rest_seconds",
            "optimal"
          ) ?? 60;

  if (format === "amrap") {
    return {
      name: sessionName,
      format: "amrap",
      scope,
      rounds: 0,
      timeCapMinutes,
      restBetweenRoundsSeconds: 0,
      movements,
      notes:
        scope === "finisher"
          ? `After your main lifts, complete as many rounds as possible in ${timeCapMinutes} minutes. Rest only as needed.`
          : `Complete as many rounds as possible in ${timeCapMinutes} minutes. Move steadily — rest only as needed.`,
    };
  }

  const rounds =
    scope === "finisher"
      ? 2
      : conditioningRoundsForSession(
          profile.minutesPerSession,
          profile.experience,
          rules
        );

  return {
    name: sessionName,
    format: "fixed_rounds",
    scope,
    rounds,
    timeCapMinutes: Math.max(
      scope === "finisher" ? 6 : 12,
      profile.minutesPerSession - (scope === "finisher" ? 12 : 8)
    ),
    restBetweenRoundsSeconds,
    movements,
    notes:
      scope === "finisher"
        ? "Quick finisher after your main work — complete all movements each round, then rest briefly."
        : "Complete all movements each round. Rest between rounds, then start the next round.",
  };
}

export function buildConditioningFinisherBlock(
  profile: ProgramUserProfile,
  rules: EvidenceRule[],
  memory?: WeekExerciseMemory
): ConditioningBlock {
  return buildConditioningBlock(
    "Metabolic finisher",
    FINISHER_PATTERNS,
    profile,
    rules,
    memory,
    { format: "amrap", scope: "finisher", movementCap: 3 }
  );
}
