import { getCatalog } from "./catalog";
import { isExerciseAvailable } from "./availability";
import { resolveExerciseDetail } from "./resolve";
import type { CatalogExercise } from "./types";

function muscleOverlap(a: CatalogExercise, b: CatalogExercise): number {
  const aSet = new Set([...a.primaryMuscles, ...a.secondaryMuscles]);
  let score = 0;
  for (const muscle of [...b.primaryMuscles, ...b.secondaryMuscles]) {
    if (aSet.has(muscle)) score += 1;
  }
  return score;
}

export function getSubstitutions(
  exerciseId: string,
  userEquipment: string[],
  limit = 5
): CatalogExercise[] {
  const exercise = resolveExerciseDetail(exerciseId);
  if (!exercise) return [];

  return getCatalog()
    .filter(
      (candidate) =>
        candidate.id !== exercise.id &&
        candidate.movementPattern === exercise.movementPattern &&
        isExerciseAvailable(candidate, userEquipment)
    )
    .sort((a, b) => {
      const overlapDiff = muscleOverlap(b, exercise) - muscleOverlap(a, exercise);
      if (overlapDiff !== 0) return overlapDiff;
      return b.priority - a.priority;
    })
    .slice(0, limit);
}

export function getUnavailableReason(
  exercise: CatalogExercise,
  userEquipment: string[]
): string[] {
  const gear = new Set(userEquipment);
  return exercise.equipment.filter((item) => !gear.has(item));
}
