import type { ExperienceLevel, FitnessGoal, UnitSystem } from "@/lib/types/profile";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";

export type LoadProgressionAction =
  | "increase_weight"
  | "increase_reps"
  | "add_set"
  | "hold"
  | "ease";

export interface ExerciseLoadProgression {
  exerciseId: string;
  suggestedWeightKg?: number;
  suggestedReps?: number;
  suggestedDurationMs?: number;
  extraSets: number;
  action: LoadProgressionAction;
  reason: string;
  basedOn:
    | "same_exercise"
    | "muscle_group"
    | "estimated_1rm"
    | "user_declared_1rm"
    | "starter_load"
    | "prescription";
  lastAvgRir?: number;
  estimatedE1rmKg?: number;
  loadPercent1rm?: number;
}

export interface BuildLoadProgressionInput {
  exercises: {
    exerciseId: string;
    name: string;
    sets: number;
    reps: string;
  }[];
  sessions: WorkoutSessionRecord[];
  experienceLevel: ExperienceLevel;
  goal: FitnessGoal;
  bodyweightKg?: number;
  declaredE1rmKg?: Map<string, number>;
  referenceDate?: Date;
  unit?: UnitSystem;
}
