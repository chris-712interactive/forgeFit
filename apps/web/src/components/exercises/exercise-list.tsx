import type { CatalogExercise } from "@forgefit/exercise-db";
import Link from "next/link";
import { formatEquipment, formatPattern } from "@/lib/exercises/labels";

interface ExerciseListProps {
  results: CatalogExercise[];
}

export function ExerciseList({ results }: ExerciseListProps) {
  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-forge-muted">
        No exercises match that search.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4 sm:gap-5">
      {results.map((exercise) => (
        <li key={exercise.id}>
          <Link
            href={`/exercises/${exercise.id}`}
            className="block rounded-2xl border border-[var(--border)] bg-forge-surface-raised px-4 py-4 transition-colors hover:border-forge-ember/40"
          >
            <p className="font-display font-semibold text-forge-text">
              {exercise.name}
            </p>
            <p className="mt-1 text-xs text-forge-muted">
              {formatPattern(exercise.movementPattern)} ·{" "}
              {exercise.primaryMuscles.join(", ")}
            </p>
            <p className="mt-1 text-xs text-forge-muted">
              {exercise.equipment.map(formatEquipment).join(" · ")}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
