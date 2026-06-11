export type FitnessGoal =
  | "fat_loss"
  | "bodybuilding"
  | "powerlifting"
  | "general_strength"
  | "recomposition";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

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

export interface NutritionTargets {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  proteinRuleId: string;
  calorieRuleId?: string;
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
}

export interface GenerateProgramOptions {
  /** Defaults to now — first session is scheduled from this calendar day */
  startDate?: Date;
}
