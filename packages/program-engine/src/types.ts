export type FitnessGoal =
  | "fat_loss"
  | "bodybuilding"
  | "powerlifting"
  | "general_strength"
  | "recomposition";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

/** Maps to evidence `daily_deficit_kcal` min / optimal / max. */
export type FatLossPace = "steady" | "moderate" | "aggressive";

/** Recomp trade-off between muscle gain and fat loss speed. */
export type RecompPriority = "muscle" | "balanced" | "lean_out";

export interface ProgramUserProfile {
  goal: FitnessGoal;
  experience: ExperienceLevel;
  sessionsPerWeek: number;
  minutesPerSession: number;
  weightKg: number;
  heightCm: number;
  age: number;
  sex: string;
  equipment: string[];
  recoveryEquipment: string[];
  fatLossPace?: FatLossPace;
  recompPriority?: RecompPriority;
  goalWeightKg?: number;
}

export interface PlannedExercise {
  exerciseId: string;
  name: string;
  primaryMuscles: string[];
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
}

export interface RecoveryBlock {
  name: string;
  durationMinutes: number;
  equipment: string;
}

export interface WarmupMovement {
  id: string;
  name: string;
  prescription: string;
}

export interface WarmupBlock {
  name: string;
  durationMinutes: number;
  focus: "push" | "pull" | "legs" | "full_body" | "general";
  movements: WarmupMovement[];
}

export interface WorkoutSession {
  dayIndex: number;
  dayLabel: string;
  name: string;
  estimatedMinutes: number;
  warmupBlock?: WarmupBlock;
  exercises: PlannedExercise[];
  recoveryBlock?: RecoveryBlock;
  citationRuleIds: string[];
}

export interface TrainingLoadSummary {
  sessionsPerWeek: number;
  weeklyEstimatedMinutes: number;
  weeklyMainWorkMinutes: number;
  weeklyWorkingSets: number;
  weeklyActiveMinutes: number;
  intensityScore: number;
}

export interface TrainingExpenditure {
  weeklyTrainingKcal: number;
  dailyTrainingKcal: number;
  ruleId: string;
}

export interface NutritionTargets {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  proteinRuleId: string;
  calorieRuleId?: string;
  bmrKcal?: number;
  lifestyleKcal?: number;
  trainingKcalPerDay?: number;
  tdeeKcal?: number;
  effectiveDeficitKcal?: number;
  effectiveSurplusKcal?: number;
  trainingLoad?: TrainingLoadSummary;
  fatLossPace?: FatLossPace;
  recompPriority?: RecompPriority;
  /** Plain-language label for the selected pace/priority (UI). */
  paceLabel?: string;
  paceSummary?: string;
}

export interface ProgramPlan {
  version: string;
  evidenceKbVersion: string;
  goal: FitnessGoal;
  experience: ExperienceLevel;
  appliedRuleIds: string[];
  nutrition: NutritionTargets;
  week: WorkoutSession[];
  /** Weekday (Mon=0) the schedule was anchored to at generation */
  scheduleAnchorWeekday?: number;
  generatedAt: string;
  summary: string;
  isDeloadWeek?: boolean;
}

export interface GenerateProgramOptions {
  /** Defaults to now — first session is scheduled from this calendar day */
  startDate?: Date;
  isDeloadWeek?: boolean;
  deloadVolumeReductionPct?: number;
  /** Regenerate: avoid placing sessions on weekdays before startDate when possible */
  scheduleFromTodayOnly?: boolean;
}
