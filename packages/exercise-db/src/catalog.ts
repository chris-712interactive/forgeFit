import catalogData from "../data/catalog.json";
import type { CatalogExercise, MovementPattern } from "./types";

const CATALOG = catalogData as CatalogExercise[];

const byId = new Map(CATALOG.map((exercise) => [exercise.id, exercise]));

export const EXERCISE_IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

export function getCatalog(): CatalogExercise[] {
  return CATALOG;
}

export function getCatalogExerciseById(id: string): CatalogExercise | undefined {
  return byId.get(id);
}

export function searchCatalog(query: {
  q?: string;
  pattern?: MovementPattern;
  muscle?: string;
  equipment?: string;
  limit?: number;
}): CatalogExercise[] {
  const needle = query.q?.trim().toLowerCase();
  const limit = query.limit ?? 40;

  let results = CATALOG;

  if (query.pattern) {
    results = results.filter((ex) => ex.movementPattern === query.pattern);
  }

  if (query.muscle) {
    const muscle = query.muscle.toLowerCase();
    results = results.filter(
      (ex) =>
        ex.primaryMuscles.some((m) => m.includes(muscle)) ||
        ex.secondaryMuscles.some((m) => m.includes(muscle)) ||
        ex.highlightMuscles.some((m) => m.includes(muscle))
    );
  }

  if (query.equipment) {
    results = results.filter((ex) => ex.equipment.includes(query.equipment!));
  }

  if (needle) {
    results = results.filter(
      (ex) =>
        ex.name.toLowerCase().includes(needle) ||
        ex.primaryMuscles.some((m) => m.includes(needle)) ||
        ex.equipment.some((e) => e.includes(needle))
    );
  }

  return results.slice(0, limit);
}

export function exerciseImageUrl(imagePath: string): string {
  return `${EXERCISE_IMAGE_BASE}${imagePath}`;
}
