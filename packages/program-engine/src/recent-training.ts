import { getExerciseById } from "@forgefit/exercise-db";
import type { RecentTrainingContext, WorkoutSession } from "./types";

export interface WeekExerciseMemory {
  usedExerciseIds: string[];
  recentMuscleGroups: string[];
}

export function createWeekExerciseMemory(
  recent?: RecentTrainingContext
): WeekExerciseMemory {
  return {
    usedExerciseIds: [...(recent?.exerciseIds ?? [])],
    recentMuscleGroups: [...(recent?.muscleGroups ?? [])],
  };
}

function pushUnique(target: string[], value: string): void {
  if (!target.includes(value)) {
    target.push(value);
  }
}

export function absorbSessionIntoMemory(
  memory: WeekExerciseMemory,
  session: WorkoutSession
): void {
  for (const exercise of session.exercises) {
    pushUnique(memory.usedExerciseIds, exercise.exerciseId);
    for (const muscle of exercise.primaryMuscles) {
      pushUnique(memory.recentMuscleGroups, muscle);
    }
  }

  if (!session.conditioningBlock) return;

  for (const movement of session.conditioningBlock.movements) {
    pushUnique(memory.usedExerciseIds, movement.exerciseId);
    const catalog = getExerciseById(movement.exerciseId);
    if (!catalog) continue;
    for (const muscle of catalog.primaryMuscles) {
      pushUnique(memory.recentMuscleGroups, muscle);
    }
  }
}
