import type { ExerciseSnapshot, LocalExerciseSet } from "@forgefit/offline-sync";

export function exerciseSlotIds(exercise: ExerciseSnapshot): string[] {
  const ids = new Set<string>([exercise.exerciseId]);
  if (exercise.plannedExerciseId) {
    ids.add(exercise.plannedExerciseId);
  }
  return [...ids];
}

export function setsForExerciseSlot(
  sets: LocalExerciseSet[],
  exercise: ExerciseSnapshot
): LocalExerciseSet[] {
  const ids = new Set(exerciseSlotIds(exercise));
  return sets
    .filter((set) => ids.has(set.exerciseId))
    .sort((a, b) => a.setNumber - b.setNumber);
}

export function completedSetsOnOriginalExercise(
  sets: LocalExerciseSet[],
  exercise: ExerciseSnapshot
): number {
  if (!exercise.plannedExerciseId) return 0;
  return sets.filter(
    (set) =>
      set.completed && set.exerciseId === exercise.plannedExerciseId
  ).length;
}
