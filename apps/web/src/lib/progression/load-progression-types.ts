import type { ExperienceLevel } from "@/lib/types/profile";
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
  extraSets: number;
  action: LoadProgressionAction;
  reason: string;
  basedOn: "same_exercise" | "muscle_group";
  lastAvgRir?: number;
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
  referenceDate?: Date;
}
