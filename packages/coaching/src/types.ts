export type CoachingGoal =
  | "fat_loss"
  | "bodybuilding"
  | "powerlifting"
  | "general_strength"
  | "recomposition";

export type CoachingExperience = "beginner" | "intermediate" | "advanced";

export interface PreWorkoutHypeInput {
  goal: CoachingGoal;
  experience: CoachingExperience;
  sessionName: string;
  displayName?: string | null;
  whyStarted?: string | null;
  isDeloadWeek?: boolean;
  workoutsCompletedThisWeek?: number;
  workoutsPlannedThisWeek?: number;
}

export type UnitSystem = "metric" | "imperial";

export interface PrCelebrationInput {
  exerciseLabel: string;
  weightKg: number;
  reps: number;
  e1rmKg: number;
  goal: CoachingGoal;
  displayName?: string | null;
  /** Defaults to metric when omitted. */
  unitSystem?: UnitSystem;
}

export interface HabitScoreInput {
  workoutsCompleted: number;
  workoutsPlanned: number;
  proteinHitDays: number;
  proteinWindowDays?: number;
  qualitySessions: number;
}

export interface HabitScoreResult {
  score: number;
  breakdown: {
    training: number;
    nutrition: number;
    quality: number;
  };
}
