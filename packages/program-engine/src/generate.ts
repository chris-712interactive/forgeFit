import {
  EVIDENCE_KB_VERSION,
  getRules,
  getRecommendationValue,
  type EvidenceRule,
} from "@forgefit/evidence-kb";
import {
  expandUserEquipment,
  holdDurationPrescription,
  isDurationHoldExercise,
  pickCardioExercise,
  pickExerciseForPattern,
  type ExerciseDifficulty,
} from "@forgefit/exercise-db";
import { computeNutrition, getMatchedRules } from "./nutrition";
import { getWeeklySplit } from "./splits";
import type {
  ExperienceLevel,
  PlannedExercise,
  ProgramPlan,
  ProgramUserProfile,
  RecoveryBlock,
  WorkoutSession,
} from "./types";

const ENGINE_VERSION = "0.1.0";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EXPERIENCE_MAX_DIFFICULTY: Record<ExperienceLevel, ExerciseDifficulty> = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
};

function volumeMultiplier(
  experience: ExperienceLevel,
  rules: EvidenceRule[]
): number {
  const fromRule = getRecommendationValue<number>(
    rules,
    "volume_multiplier",
    "optimal"
  );
  if (fromRule) return fromRule;
  return { beginner: 0.6, intermediate: 1, advanced: 1.2 }[experience];
}

function exercisesPerSession(minutes: number): number {
  if (minutes <= 30) return 3;
  if (minutes <= 45) return 4;
  if (minutes <= 60) return 5;
  return 6;
}

function setsPerExercise(
  minutes: number,
  goal: ProgramUserProfile["goal"],
  volumeMult: number
): number {
  let base = minutes <= 30 ? 2 : minutes <= 45 ? 3 : 4;
  if (goal === "powerlifting") base = Math.max(base, 4);
  if (goal === "fat_loss" && minutes <= 30) base = 2;
  return Math.max(2, Math.round(base * volumeMult));
}

function repsForGoal(goal: ProgramUserProfile["goal"], rules: EvidenceRule[]): string {
  const hypertrophy = getRecommendationValue<string>(rules, "reps_range", "optimal");
  if (goal === "powerlifting") return "3-5";
  if (goal === "general_strength") return hypertrophy === "8-15" ? "5-8" : "5-8";
  if (goal === "bodybuilding" || goal === "recomposition") return hypertrophy ?? "8-12";
  return "8-12";
}

function restForGoal(goal: ProgramUserProfile["goal"], rules: EvidenceRule[]): number {
  const key =
    goal === "powerlifting" || goal === "general_strength"
      ? "rest_seconds"
      : "rest_seconds";
  const fromRules = getRecommendationValue<number>(rules, key, "optimal");
  if (fromRules) return fromRules;
  return goal === "powerlifting" || goal === "general_strength" ? 180 : 90;
}

const RECOVERY_BLOCK_PRIORITY: {
  equipment: string;
  name: string;
  defaultMinutes: number;
}[] = [
  { equipment: "foam_roller", name: "Foam Roll & Mobility", defaultMinutes: 8 },
  {
    equipment: "trigger_point_ball",
    name: "Trigger Point Release",
    defaultMinutes: 8,
  },
  {
    equipment: "lacrosse_ball",
    name: "Lacrosse Ball Release",
    defaultMinutes: 8,
  },
  { equipment: "massage_gun", name: "Percussive Recovery", defaultMinutes: 8 },
  { equipment: "yoga_blocks_strap", name: "Supported Stretch", defaultMinutes: 10 },
  { equipment: "yoga_mat", name: "Stretch & Breathe", defaultMinutes: 10 },
  { equipment: "resistance_bands", name: "Band Mobility", defaultMinutes: 8 },
  {
    equipment: "compression_boots",
    name: "Compression Boot Session",
    defaultMinutes: 15,
  },
  {
    equipment: "compression_gear",
    name: "Compression Recovery",
    defaultMinutes: 10,
  },
  { equipment: "cold_plunge", name: "Cold Exposure", defaultMinutes: 5 },
  { equipment: "cryotherapy", name: "Cryotherapy", defaultMinutes: 3 },
  { equipment: "sauna", name: "Sauna Cooldown", defaultMinutes: 12 },
  { equipment: "steam_room", name: "Steam Session", defaultMinutes: 10 },
  { equipment: "hot_tub", name: "Hot Tub Relax", defaultMinutes: 12 },
  {
    equipment: "red_light_therapy",
    name: "Red Light Recovery",
    defaultMinutes: 10,
  },
  {
    equipment: "active_recovery_access",
    name: "Easy Active Recovery",
    defaultMinutes: 15,
  },
];

function recoveryDurationMinutes(
  equipment: string,
  rules: EvidenceRule[],
  fallback: number
): number {
  const rule = rules.find((r) =>
    r.applies_to.includes(`recovery:${equipment}`)
  );
  if (!rule) return fallback;
  const rec = rule.recommendation.duration_minutes;
  if (rec && typeof rec === "object" && "optimal" in rec) {
    return (rec as { optimal: number }).optimal;
  }
  return fallback;
}

function buildRecoveryBlock(
  recoveryEquipment: string[],
  rules: EvidenceRule[]
): RecoveryBlock | undefined {
  for (const block of RECOVERY_BLOCK_PRIORITY) {
    if (!recoveryEquipment.includes(block.equipment)) continue;
    return {
      name: block.name,
      durationMinutes: recoveryDurationMinutes(
        block.equipment,
        rules,
        block.defaultMinutes
      ),
      equipment: block.equipment,
    };
  }
  return undefined;
}

function buildSession(
  template: ReturnType<typeof getWeeklySplit>[number],
  dayIndex: number,
  profile: ProgramUserProfile,
  rules: EvidenceRule[],
  volumeMult: number
): WorkoutSession {
  const maxDiff = EXPERIENCE_MAX_DIFFICULTY[profile.experience];
  const equipment = expandUserEquipment(profile.equipment);
  const usedIds: string[] = [];
  const maxExercises = exercisesPerSession(profile.minutesPerSession);
  const sets = setsPerExercise(
    profile.minutesPerSession,
    profile.goal,
    volumeMult
  );
  const reps = repsForGoal(profile.goal, rules);
  const rest = restForGoal(profile.goal, rules);

  const exercises: PlannedExercise[] = [];

  for (const pattern of template.patterns) {
    if (exercises.length >= maxExercises) break;
    const picked = pickExerciseForPattern(
      pattern,
      equipment,
      maxDiff,
      usedIds
    );
    if (!picked) continue;
    usedIds.push(picked.id);
    const exerciseReps = isDurationHoldExercise(picked.id)
      ? (holdDurationPrescription(picked.id, profile.experience) ?? "30-45 sec")
      : reps;

    exercises.push({
      exerciseId: picked.id,
      name: picked.name,
      primaryMuscles: picked.primaryMuscles,
      sets,
      reps: exerciseReps,
      restSeconds: isDurationHoldExercise(picked.id) ? 60 : rest,
      notes:
        profile.goal === "powerlifting" && picked.priority >= 9
          ? "Top set @ RPE 8, back-off sets -10%"
          : isDurationHoldExercise(picked.id)
            ? "Hold a straight line — stop when form breaks"
            : undefined,
    });
  }

  if (template.includeCardio) {
    const cardio = pickCardioExercise(equipment, profile.goal);
    if (cardio) {
      exercises.push({
        exerciseId: cardio.exerciseId,
        name: cardio.name,
        primaryMuscles: ["cardio"],
        sets: 1,
        reps: cardio.reps,
        restSeconds: 0,
        notes: cardio.notes,
      });
    }
  }

  const recoveryBlock = buildRecoveryBlock(profile.recoveryEquipment, rules);
  const exerciseMinutes = exercises.reduce(
    (acc, ex) => acc + ex.sets * (rest / 60 + 0.5),
    0
  );
  const recoveryMins = recoveryBlock?.durationMinutes ?? 0;
  const estimatedMinutes = Math.min(
    profile.minutesPerSession,
    Math.round(exerciseMinutes + recoveryMins)
  );

  const citationRuleIds = rules
    .filter((r) => r.domain === "training" || r.domain === "recovery")
    .slice(0, 3)
    .map((r) => r.id);

  return {
    dayIndex,
    dayLabel: DAY_LABELS[dayIndex % DAY_LABELS.length],
    name: template.name,
    estimatedMinutes,
    exercises,
    recoveryBlock,
    citationRuleIds,
  };
}

export function generateProgram(profile: ProgramUserProfile): ProgramPlan {
  const allRules = getRules();
  const matchedRules = getMatchedRules(allRules, profile);
  const volumeMult = volumeMultiplier(profile.experience, matchedRules);
  const split = getWeeklySplit(profile.goal, profile.sessionsPerWeek);

  const week = split.map((template, i) =>
    buildSession(template, i, profile, matchedRules, volumeMult)
  );

  const nutrition = computeNutrition(profile, matchedRules);

  const appliedRuleIds = [
    ...new Set([
      ...matchedRules.map((r) => r.id),
      nutrition.proteinRuleId,
      ...(nutrition.calorieRuleId ? [nutrition.calorieRuleId] : []),
    ]),
  ];

  const goalLabel = profile.goal.replace(/_/g, " ");

  return {
    version: ENGINE_VERSION,
    evidenceKbVersion: EVIDENCE_KB_VERSION,
    goal: profile.goal,
    experience: profile.experience,
    appliedRuleIds,
    nutrition,
    week,
    generatedAt: new Date().toISOString(),
    summary: `${goalLabel} program · ${profile.sessionsPerWeek}×${profile.minutesPerSession} min · ${week.length} sessions built from ${appliedRuleIds.length} evidence rules`,
  };
}
