import { getCatalog } from "./catalog";
import { isExerciseAvailable } from "./availability";
import { resolveExerciseDetail } from "./resolve";
import type { CatalogExercise, Exercise } from "./types";

export interface SubstitutionOptions {
  /** Equipment the user cannot use right now (e.g. machine taken). */
  excludeEquipment?: string[];
}

function muscleOverlap(a: CatalogExercise, b: CatalogExercise): number {
  const aSet = new Set([...a.primaryMuscles, ...a.secondaryMuscles]);
  let score = 0;
  for (const muscle of [...b.primaryMuscles, ...b.secondaryMuscles]) {
    if (aSet.has(muscle)) score += 1;
  }
  return score;
}

function usesExcludedEquipment(
  exercise: CatalogExercise,
  excluded: Set<string>
): boolean {
  if (excluded.size === 0) return false;
  return exercise.equipment.some((item) => excluded.has(item));
}

function rankSubstitutions(
  exercise: CatalogExercise,
  candidates: CatalogExercise[]
): CatalogExercise[] {
  return candidates.sort((a, b) => {
    const overlapDiff = muscleOverlap(b, exercise) - muscleOverlap(a, exercise);
    if (overlapDiff !== 0) return overlapDiff;
    return b.priority - a.priority;
  });
}

export function getSubstitutions(
  exerciseId: string,
  userEquipment: string[],
  limit = 5,
  options: SubstitutionOptions = {}
): CatalogExercise[] {
  const exercise = resolveExerciseDetail(exerciseId);
  if (!exercise) return [];

  const excluded = new Set(options.excludeEquipment ?? []);

  const baseCandidates = getCatalog().filter(
    (candidate) =>
      candidate.id !== exercise.id &&
      candidate.movementPattern === exercise.movementPattern &&
      isExerciseAvailable(candidate, userEquipment)
  );

  const filtered =
    excluded.size > 0
      ? baseCandidates.filter(
          (candidate) => !usesExcludedEquipment(candidate, excluded)
        )
      : baseCandidates;

  return rankSubstitutions(exercise, filtered).slice(0, limit);
}

/** Default busy equipment when opening the in-session swap sheet. */
export function suggestBusyEquipment(exercise: Exercise): string[] {
  const gear = exercise.equipment.filter((item) => item !== "bodyweight_only");
  if (gear.includes("machines")) return ["machines"];
  if (gear.length > 0) return [gear[0]!];
  return [];
}

export function buildSubstitutionReason(
  original: Exercise,
  substitute: CatalogExercise,
  excludeEquipment?: string[]
): string {
  const excluded = new Set(excludeEquipment ?? []);
  const added = substitute.equipment.filter(
    (item) =>
      item !== "bodyweight_only" && !original.equipment.includes(item)
  );
  const removed = original.equipment.filter(
    (item) =>
      item !== "bodyweight_only" &&
      (excluded.has(item) || !substitute.equipment.includes(item))
  );

  if (added.length > 0 && removed.length > 0) {
    return `Uses ${formatEquipmentList(added)} instead of ${formatEquipmentList(removed)}`;
  }
  if (removed.length > 0) {
    return `Skips ${formatEquipmentList(removed)}`;
  }
  if (added.length > 0) {
    return `Uses ${formatEquipmentList(added)}`;
  }
  return "Same movement pattern";
}

function formatEquipmentList(items: string[]): string {
  return items.map((item) => item.replace(/_/g, " ")).join(", ");
}

export function getUnavailableReason(
  exercise: CatalogExercise,
  userEquipment: string[]
): string[] {
  const gear = new Set(userEquipment);
  return exercise.equipment.filter((item) => !gear.has(item));
}
