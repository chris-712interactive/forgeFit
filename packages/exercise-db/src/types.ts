export type MovementPattern =
  | "squat"
  | "hinge"
  | "horizontal_push"
  | "vertical_push"
  | "horizontal_pull"
  | "vertical_pull"
  | "lunge"
  | "carry"
  | "core"
  | "isolation_arms"
  | "isolation_legs"
  | "cardio";

export type ExerciseDifficulty = "beginner" | "intermediate" | "advanced";

export interface Exercise {
  id: string;
  name: string;
  movementPattern: MovementPattern;
  primaryMuscles: string[];
  equipment: string[];
  difficulty: ExerciseDifficulty;
  /** Compound lifts rank higher when time is limited */
  priority: number;
}

export interface CatalogExercise extends Exercise {
  sourceId: string;
  secondaryMuscles: string[];
  category: string;
  mechanic: string | null;
  instructions: string[];
  imagePaths: string[];
  highlightMuscles: string[];
}
