import {
  getUnavailableReason,
  isExerciseAvailable,
  type CatalogExercise,
} from "@forgefit/exercise-db";
import Link from "next/link";
import { formatEquipment } from "@/lib/exercises/labels";

import { sanitizeReturnTo } from "@/lib/navigation/return-to";

interface SubstitutionListProps {
  substitutions: CatalogExercise[];
  userEquipment: string[];
  returnTo?: string | null;
}

export function SubstitutionList({
  substitutions,
  userEquipment,
  returnTo,
}: SubstitutionListProps) {
  const safeReturn = sanitizeReturnTo(returnTo);
  const returnQuery = safeReturn
    ? `?returnTo=${encodeURIComponent(safeReturn)}`
    : "";
  if (substitutions.length === 0) {
    return (
      <p className="text-sm text-forge-muted">
        No equipment-based swaps found for this movement pattern.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {substitutions.map((exercise) => {
        const available = isExerciseAvailable(exercise, userEquipment);
        const missing = getUnavailableReason(exercise, userEquipment);

        return (
          <li key={exercise.id}>
            <Link
              href={`/exercises/${exercise.id}${returnQuery}`}
              className="block rounded-xl border border-[var(--border)] bg-forge-surface px-4 py-3 transition-colors hover:border-forge-ember/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-forge-text">{exercise.name}</p>
                  <p className="mt-1 text-xs text-forge-muted">
                    {exercise.equipment.map(formatEquipment).join(" · ")}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    available
                      ? "bg-forge-success/15 text-forge-success"
                      : "bg-forge-gold/15 text-forge-gold"
                  }`}
                >
                  {available ? "Available" : "Preview"}
                </span>
              </div>
              {!available && missing.length > 0 && (
                <p className="mt-2 text-xs text-forge-muted">
                  Needs: {missing.map(formatEquipment).join(", ")}
                </p>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
