import {
  EVIDENCE_KB_VERSION,
  getRules,
  getRecommendationValue,
  type EvidenceRule,
} from "@forgefit/evidence-kb";
import {
  expandUserEquipment,
  getExerciseById,
  holdDurationPrescription,
  isDurationHoldExercise,
  isFunctionalPattern,
  pickCardioExercise,
  pickExerciseForPattern,
  type ExerciseDifficulty,
  type MovementPattern,
} from "@forgefit/exercise-db";
import { applyDeloadWeek } from "./deload";
import {
  COMPOUND_FLOOR_PATTERNS,
  fillerPatternsForGoal,
  functionalBiasForGoal,
  minCompoundExercisesForGoal,
} from "./functional";
import { computeNutrition, getMatchedRules } from "./nutrition";
import {
  estimateExerciseMinutes,
  estimateMainWorkMinutes,
} from "./session-time";
import { buildConditioningBlock } from "./conditioning";
import {
  avoidConsecutiveSameKind,
  rotateSplitAvoidingKind,
} from "./session-kind";
import {
  absorbSessionIntoMemory,
  createWeekExerciseMemory,
  type WeekExerciseMemory,
} from "./recent-training";
import { blockedWeekdaysForProfile } from "./sport/practice-schedule";
import {
  assignSessionWeekdays,
  dayLabelForIndex,
  isoWeekdayFromDate,
  toScheduleStartIso,
} from "./schedule";
import { computeTrainingLoad } from "./training-load";
import { estimateTrainingExpenditure } from "./training-expenditure";
import { getWeeklySplit, type SessionTemplate } from "./splits";
import {
  mergeSessionPatterns,
  sportRepsRange,
} from "./sport/patterns";
import {
  resolveWeeklySplit,
  sportSessionCap,
  sportSummarySuffix,
  sportVolumeMultiplier,
} from "./sport";
import {
  appendRampSetNote,
  buildWarmupBlock,
  warmUpRampSetCount,
} from "./warmup";
import type {
  ExperienceLevel,
  GenerateProgramOptions,
  PlannedExercise,
  ProgramPlan,
  ProgramUserProfile,
  RecoveryBlock,
  WorkoutSession,
} from "./types";

const ENGINE_VERSION = "0.1.0";

const EXPERIENCE_MAX_DIFFICULTY: Record<ExperienceLevel, ExerciseDifficulty> = {
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
};

const COMPOUND_PATTERNS: MovementPattern[] = [
  "squat",
  "hinge",
  "horizontal_push",
  "horizontal_pull",
  "vertical_push",
  "vertical_pull",
  "lunge",
];

function maxDifficultyForPattern(
  experience: ExperienceLevel,
  pattern: MovementPattern
): ExerciseDifficulty {
  const base = EXPERIENCE_MAX_DIFFICULTY[experience];
  if (experience === "beginner" && COMPOUND_PATTERNS.includes(pattern)) {
    return "intermediate";
  }
  return base;
}

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
  const scaled = Math.max(2, Math.round(base * volumeMult));
  if (minutes >= 45 && scaled < 3) return 3;
  return scaled;
}

const EXPERIENCE_SET_CEILING: Record<ExperienceLevel, number> = {
  beginner: 20,
  intermediate: 24,
  advanced: 28,
};

const MAX_SETS_PER_EXERCISE: Record<ExperienceLevel, number> = {
  beginner: 5,
  intermediate: 6,
  advanced: 6,
};

function countCompoundExercises(exercises: PlannedExercise[]): number {
  return exercises.filter((exercise) => {
    const picked = getExerciseById(exercise.exerciseId);
    return picked ? isFunctionalPattern(picked.movementPattern) : false;
  }).length;
}

function sessionHasPattern(
  exercises: PlannedExercise[],
  pattern: MovementPattern
): boolean {
  return exercises.some((exercise) => {
    const picked = getExerciseById(exercise.exerciseId);
    return picked?.movementPattern === pattern;
  });
}

function minCompoundExercises(
  profile: ProgramUserProfile,
  rules: EvidenceRule[]
): number {
  const fromGoalRule = getRecommendationValue<number>(
    rules,
    "min_compound_exercises_per_session",
    "optimal"
  );
  if (fromGoalRule) return fromGoalRule;

  const fromGeneralRule = getRecommendationValue<number>(
    rules,
    "min_compound_exercises",
    "optimal"
  );
  return fromGeneralRule ?? minCompoundExercisesForGoal(profile.goal);
}

function ensureCompoundFloor(
  exercises: PlannedExercise[],
  usedIds: string[],
  equipment: string[],
  profile: ProgramUserProfile,
  rules: EvidenceRule[],
  sets: number,
  reps: string,
  rest: number,
  rampSets: number | null,
  recentMuscleGroups: string[]
): void {
  const target = minCompoundExercises(profile, rules);
  let compoundCount = countCompoundExercises(exercises);
  if (compoundCount >= target) return;

  for (const pattern of COMPOUND_FLOOR_PATTERNS) {
    if (compoundCount >= target) break;
    if (sessionHasPattern(exercises, pattern)) continue;

    appendExerciseFromPattern(
      pattern,
      exercises,
      usedIds,
      equipment,
      profile.experience,
      sets,
      reps,
      rest,
      profile,
      rampSets,
      { insertAtStart: true, recentMuscleGroups }
    );

    compoundCount = countCompoundExercises(exercises);
  }
}

function totalWorkingSets(exercises: PlannedExercise[]): number {
  return exercises.reduce((acc, ex) => acc + ex.sets, 0);
}

function isScalableExercise(exercise: PlannedExercise): boolean {
  return (
    exercise.primaryMuscles[0] !== "cardio" &&
    !isDurationHoldExercise(exercise.exerciseId)
  );
}

function maxSetsForSession(
  profile: ProgramUserProfile,
  rules: EvidenceRule[],
  mainBudgetMinutes: number
): number {
  const fromRule = getRecommendationValue<number>(
    rules,
    "max_sets_per_session",
    "optimal"
  );
  const evidenceCap =
    fromRule ??
    ({ beginner: 12, intermediate: 18, advanced: 22 } as const)[
      profile.experience
    ];
  const timeBased = Math.floor(mainBudgetMinutes / 2.25);
  return Math.min(
    EXPERIENCE_SET_CEILING[profile.experience],
    Math.max(evidenceCap, timeBased)
  );
}

function scaleRecoveryToSession(
  durationMinutes: number,
  profile: ProgramUserProfile
): number {
  const sessionCap = Math.max(
    5,
    Math.min(12, Math.round(profile.minutesPerSession * 0.1))
  );
  return Math.min(durationMinutes, sessionCap);
}

function appendExerciseFromPattern(
  pattern: MovementPattern,
  exercises: PlannedExercise[],
  usedIds: string[],
  equipment: string[],
  experience: ExperienceLevel,
  sets: number,
  reps: string,
  rest: number,
  profile: ProgramUserProfile,
  rampSets: number | null,
  options: { insertAtStart?: boolean; recentMuscleGroups?: string[] } = {}
): boolean {
  const recentMuscleGroups = options.recentMuscleGroups ?? [];
  const picked = pickExerciseForPattern(
    pattern,
    equipment,
    maxDifficultyForPattern(experience, pattern),
    usedIds,
    {
      functionalBias: functionalBiasForGoal(profile.goal, pattern),
      recentMuscleGroups,
    }
  );
  if (!picked) return false;

  usedIds.push(picked.id);
  const exerciseReps = isDurationHoldExercise(picked.id)
    ? (holdDurationPrescription(picked.id, profile.experience) ?? "30-45 sec")
    : reps;

  let notes = isDurationHoldExercise(picked.id)
    ? "Hold a straight line — stop when form breaks"
    : undefined;

  if (
    rampSets &&
    exercises.length === 0 &&
    !isDurationHoldExercise(picked.id) &&
    picked.movementPattern !== "cardio"
  ) {
    notes = appendRampSetNote(notes, rampSets);
  }

  const planned: PlannedExercise = {
    exerciseId: picked.id,
    name: picked.name,
    primaryMuscles: picked.primaryMuscles,
    sets,
    reps: exerciseReps,
    restSeconds: isDurationHoldExercise(picked.id) ? 60 : rest,
    notes,
  };

  if (options.insertAtStart) {
    exercises.unshift(planned);
  } else {
    exercises.push(planned);
  }
  return true;
}

function fillSessionToTimeBudget(
  exercises: PlannedExercise[],
  mainBudgetMinutes: number,
  profile: ProgramUserProfile,
  rules: EvidenceRule[],
  maxExercises: number,
  usedIds: string[],
  equipment: string[],
  sets: number,
  reps: string,
  rest: number,
  rampSets: number | null,
  templatePatterns: MovementPattern[],
  recentMuscleGroups: string[]
): void {
  const maxSets = maxSetsForSession(profile, rules, mainBudgetMinutes);
  const targetMinutes = mainBudgetMinutes * 0.92;
  const patternQueue = [
    ...templatePatterns,
    ...fillerPatternsForGoal(profile.goal, templatePatterns),
  ];

  while (
    exercises.length < maxExercises &&
    estimateMainWorkMinutes(exercises) < targetMinutes
  ) {
    let added = false;
    for (const pattern of patternQueue) {
      if (exercises.length >= maxExercises) break;
      if (appendExerciseFromPattern(
        pattern,
        exercises,
        usedIds,
        equipment,
        profile.experience,
        sets,
        reps,
        rest,
        profile,
        rampSets,
        { recentMuscleGroups }
      )) {
        added = true;
        break;
      }
    }
    if (!added) break;
  }

  const maxSetsPerExercise = MAX_SETS_PER_EXERCISE[profile.experience];
  let guard = 0;

  while (
    estimateMainWorkMinutes(exercises) < targetMinutes &&
    totalWorkingSets(exercises) < maxSets &&
    guard < 80
  ) {
    guard += 1;
    const scalable = exercises.filter(
      (exercise) =>
        isScalableExercise(exercise) &&
        exercise.sets < maxSetsPerExercise
    );

    if (scalable.length > 0) {
      const next = [...scalable].sort((a, b) => a.sets - b.sets)[0];
      next.sets += 1;
      continue;
    }

    if (exercises.length >= maxExercises) break;

    let added = false;
    for (const pattern of patternQueue) {
      if (
        appendExerciseFromPattern(
          pattern,
          exercises,
          usedIds,
          equipment,
          profile.experience,
          sets,
          reps,
          rest,
          profile,
          rampSets
        )
      ) {
        added = true;
        break;
      }
    }
    if (!added) break;
  }
}

function repsForGoal(
  goal: ProgramUserProfile["goal"],
  rules: EvidenceRule[]
): string {
  if (goal === "sport_performance") {
    return sportRepsRange(rules, "5-8");
  }

  const hypertrophy = getRecommendationValue<string>(rules, "reps_range", "optimal");
  if (goal === "powerlifting") return "3-5";
  if (goal === "general_strength" || goal === "functional_conditioning") {
    return hypertrophy === "8-15" ? "5-8" : "5-8";
  }
  if (goal === "bodybuilding" || goal === "recomposition") return hypertrophy ?? "8-12";
  return "8-12";
}

function restForGoal(goal: ProgramUserProfile["goal"], rules: EvidenceRule[]): number {
  const key =
    goal === "powerlifting" ||
    goal === "general_strength" ||
    goal === "functional_conditioning" ||
    goal === "sport_performance"
      ? "rest_seconds"
      : "rest_seconds";
  const fromRules = getRecommendationValue<number>(rules, key, "optimal");
  if (fromRules) return fromRules;
  return goal === "powerlifting" ||
    goal === "general_strength" ||
    goal === "functional_conditioning" ||
    goal === "sport_performance"
    ? 180
    : 90;
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

function buildConditioningSession(
  template: SessionTemplate,
  dayIndex: number,
  profile: ProgramUserProfile,
  rules: EvidenceRule[],
  memory?: WeekExerciseMemory
): WorkoutSession {
  const warmupBlock = buildWarmupBlock(template, profile, rules);
  const conditioningBlock = buildConditioningBlock(
    template.name,
    template.patterns,
    profile,
    rules,
    memory
  );
  const recoveryBlock = buildRecoveryBlock(profile.recoveryEquipment, rules);
  const recoveryMins = recoveryBlock
    ? scaleRecoveryToSession(recoveryBlock.durationMinutes, profile)
    : 0;
  const scaledRecoveryBlock = recoveryBlock
    ? { ...recoveryBlock, durationMinutes: recoveryMins }
    : undefined;
  const mainMins = Math.max(
    10,
    profile.minutesPerSession - warmupBlock.durationMinutes - recoveryMins
  );

  return {
    dayIndex,
    dayLabel: dayLabelForIndex(dayIndex),
    name: template.name,
    estimatedMinutes: warmupBlock.durationMinutes + mainMins + recoveryMins,
    warmupBlock,
    exercises: [],
    conditioningBlock,
    recoveryBlock: scaledRecoveryBlock,
    citationRuleIds: [
      "functional_conditioning_hybrid_split",
      "functional_conditioning_rounds",
    ],
  };
}

function buildSession(
  template: SessionTemplate,
  dayIndex: number,
  profile: ProgramUserProfile,
  rules: EvidenceRule[],
  volumeMult: number,
  memory: WeekExerciseMemory,
  useWeekMemory: boolean
): WorkoutSession {
  if (template.sessionType === "conditioning") {
    return buildConditioningSession(
      template,
      dayIndex,
      profile,
      rules,
      useWeekMemory ? memory : undefined
    );
  }

  const equipment = expandUserEquipment(profile.equipment);
  const usedIds = useWeekMemory ? [...memory.usedExerciseIds] : [];
  const recentMuscleGroups = useWeekMemory ? [...memory.recentMuscleGroups] : [];
  const maxExercises = exercisesPerSession(profile.minutesPerSession);
  const sets = setsPerExercise(
    profile.minutesPerSession,
    profile.goal,
    volumeMult
  );
  const reps = repsForGoal(profile.goal, rules);
  const rest = restForGoal(profile.goal, rules);
  const warmupBlock = buildWarmupBlock(template, profile, rules);
  const rampSets = warmUpRampSetCount(profile.experience, rules);
  const sessionPatterns = mergeSessionPatterns(template.patterns, rules);

  const exercises: PlannedExercise[] = [];

  for (const pattern of sessionPatterns) {
    if (exercises.length >= maxExercises) break;
    const picked = pickExerciseForPattern(
      pattern,
      equipment,
      maxDifficultyForPattern(profile.experience, pattern),
      usedIds,
      {
        functionalBias: functionalBiasForGoal(profile.goal, pattern),
        recentMuscleGroups,
      }
    );
    if (!picked) continue;
    usedIds.push(picked.id);
    const exerciseReps = isDurationHoldExercise(picked.id)
      ? (holdDurationPrescription(picked.id, profile.experience) ?? "30-45 sec")
      : reps;

    let notes =
      profile.goal === "powerlifting" && picked.priority >= 9
        ? "Top set @ RPE 8, back-off sets -10%"
        : isDurationHoldExercise(picked.id)
          ? "Hold a straight line — stop when form breaks"
          : undefined;

    if (
      rampSets &&
      exercises.length === 0 &&
      !isDurationHoldExercise(picked.id) &&
      picked.movementPattern !== "cardio"
    ) {
      notes = appendRampSetNote(notes, rampSets);
    }

    exercises.push({
      exerciseId: picked.id,
      name: picked.name,
      primaryMuscles: picked.primaryMuscles,
      sets,
      reps: exerciseReps,
      restSeconds: isDurationHoldExercise(picked.id) ? 60 : rest,
      notes,
    });
  }

  const recoveryBlock = buildRecoveryBlock(profile.recoveryEquipment, rules);
  const recoveryMins = recoveryBlock
    ? scaleRecoveryToSession(recoveryBlock.durationMinutes, profile)
    : 0;
  const scaledRecoveryBlock = recoveryBlock
    ? { ...recoveryBlock, durationMinutes: recoveryMins }
    : undefined;

  const mainBudgetMinutes = Math.max(
    10,
    profile.minutesPerSession -
      warmupBlock.durationMinutes -
      recoveryMins
  );

  ensureCompoundFloor(
    exercises,
    usedIds,
    equipment,
    profile,
    rules,
    sets,
    reps,
    rest,
    rampSets,
    recentMuscleGroups
  );

  fillSessionToTimeBudget(
    exercises,
    mainBudgetMinutes,
    profile,
    rules,
    maxExercises,
    usedIds,
    equipment,
    sets,
    reps,
    rest,
    rampSets,
    sessionPatterns,
    recentMuscleGroups
  );

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

  const exerciseMinutes = estimateMainWorkMinutes(exercises);
  const estimatedMinutes = Math.min(
    profile.minutesPerSession,
    Math.round(
      warmupBlock.durationMinutes + exerciseMinutes + recoveryMins
    )
  );

  const citationRuleIds = rules
    .filter((r) => r.domain === "training" || r.domain === "recovery")
    .slice(0, 3)
    .map((r) => r.id);

  return {
    dayIndex,
    dayLabel: dayLabelForIndex(dayIndex),
    name: template.name,
    estimatedMinutes,
    warmupBlock,
    exercises,
    recoveryBlock: scaledRecoveryBlock,
    citationRuleIds,
  };
}

export function generateProgram(
  profile: ProgramUserProfile,
  options: GenerateProgramOptions = {}
): ProgramPlan {
  const allRules = getRules();
  const matchedRules = getMatchedRules(allRules, profile);
  let volumeMult = volumeMultiplier(profile.experience, matchedRules);
  volumeMult = sportVolumeMultiplier(profile, matchedRules, volumeMult);

  let split = resolveWeeklySplit(profile);
  const sessionCap = sportSessionCap(profile, matchedRules);
  if (sessionCap != null && split.length > sessionCap) {
    split = split.slice(0, sessionCap);
  }
  if (options.recentTraining?.lastSessionKind) {
    split = rotateSplitAvoidingKind(split, options.recentTraining.lastSessionKind);
  }
  const startDate = options.startDate ?? new Date();
  const anchorWeekday = isoWeekdayFromDate(startDate);
  const sessionWeekdays = assignSessionWeekdays(split.length, anchorWeekday, {
    scheduleFromTodayOnly: options.scheduleFromTodayOnly,
    blockedWeekdays: blockedWeekdaysForProfile(profile),
  });

  const useWeekMemory = options.recentTraining != null;
  const memory = createWeekExerciseMemory(options.recentTraining);
  const templatesWithDays = split
    .map((template, i) => ({
      template,
      dayIndex: sessionWeekdays[i] ?? anchorWeekday,
    }))
    .sort((a, b) => a.dayIndex - b.dayIndex);

  if (options.recentTraining?.lastSessionKind) {
    avoidConsecutiveSameKind(templatesWithDays);
  }

  const week = templatesWithDays.map(({ template, dayIndex }) => {
    const session = buildSession(
      template,
      dayIndex,
      profile,
      matchedRules,
      volumeMult,
      memory,
      useWeekMemory
    );
    if (useWeekMemory) {
      absorbSessionIntoMemory(memory, session);
    }
    return session;
  });

  const trainingLoad = computeTrainingLoad(week);
  const trainingExpenditure = estimateTrainingExpenditure(
    week,
    trainingLoad,
    profile
  );
  const nutrition = computeNutrition(profile, matchedRules, {
    trainingLoad,
    expenditure: trainingExpenditure,
  });

  const appliedRuleIds = [
    ...new Set([
      ...matchedRules.map((r) => r.id),
      nutrition.proteinRuleId,
      ...(nutrition.calorieRuleId ? [nutrition.calorieRuleId] : []),
      trainingExpenditure.ruleId,
    ]),
  ];

  const goalLabel = profile.goal.replace(/_/g, " ");
  const sportSuffix = sportSummarySuffix(profile);

  let plan: ProgramPlan = {
    version: ENGINE_VERSION,
    evidenceKbVersion: EVIDENCE_KB_VERSION,
    goal: profile.goal,
    experience: profile.experience,
    appliedRuleIds,
    nutrition,
    week,
    scheduleAnchorWeekday: anchorWeekday,
    scheduleStartDate: toScheduleStartIso(startDate),
    generatedAt: startDate.toISOString(),
    summary: `${goalLabel} program${sportSuffix} · ${profile.sessionsPerWeek}×${profile.minutesPerSession} min · starts ${dayLabelForIndex(anchorWeekday)} · ${week.length} sessions built from ${appliedRuleIds.length} evidence rules`,
  };

  if (options.isDeloadWeek) {
    plan = applyDeloadWeek(plan, options.deloadVolumeReductionPct ?? 40);
    plan.appliedRuleIds = [...new Set([...plan.appliedRuleIds, "deload_intermediate"])];
  }

  return plan;
}
