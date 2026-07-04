"use client";

import {
  getUnavailableReason,
  isExerciseAvailable,
  type CatalogExercise,
} from "@forgefit/exercise-db";
import { swapExerciseInSession } from "@forgefit/offline-sync";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatEquipment } from "@/lib/exercises/labels";
import { sanitizeReturnTo } from "@/lib/navigation/return-to";
import type { WorkoutSwapReturnTarget } from "@/lib/workouts/exercise-swap-return";
import { useState } from "react";

interface SubstitutionListProps {
  substitutions: CatalogExercise[];
  userEquipment: string[];
  returnTo?: string | null;
  workoutSwapTarget?: WorkoutSwapReturnTarget | null;
}

export function SubstitutionList({
  substitutions,
  userEquipment,
  returnTo,
  workoutSwapTarget = null,
}: SubstitutionListProps) {
  const router = useRouter();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
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

  async function handleUseInWorkout(exercise: CatalogExercise) {
    if (!workoutSwapTarget) return;
    setSubmittingId(exercise.id);
    try {
      const updated = await swapExerciseInSession({
        sessionClientId: workoutSwapTarget.clientId,
        exerciseIndex: workoutSwapTarget.exerciseIndex,
        newExerciseId: exercise.id,
        newExerciseName: exercise.name,
        reason: "equipment_busy",
      });
      if (!updated) return;
      router.push(
        `/workout?active=${encodeURIComponent(workoutSwapTarget.clientId)}`
      );
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <ul className="space-y-3">
      {substitutions.map((exercise) => {
        const available = isExerciseAvailable(exercise, userEquipment);
        const missing = getUnavailableReason(exercise, userEquipment);
        const cardBody = (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-forge-text">{exercise.name}</p>
                <p className="mt-1 text-xs text-forge-muted">
                  {exercise.equipment.map(formatEquipment).join(" · ")}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  workoutSwapTarget
                    ? "bg-forge-ember/15 text-forge-ember"
                    : available
                      ? "bg-forge-success/15 text-forge-success"
                      : "bg-forge-gold/15 text-forge-gold"
                }`}
              >
                {workoutSwapTarget
                  ? submittingId === exercise.id
                    ? "Applying…"
                    : "Use in workout"
                  : available
                    ? "Available"
                    : "Preview"}
              </span>
            </div>
            {!available && missing.length > 0 && !workoutSwapTarget && (
              <p className="mt-2 text-xs text-forge-muted">
                Needs: {missing.map(formatEquipment).join(", ")}
              </p>
            )}
          </>
        );

        return (
          <li key={exercise.id}>
            {workoutSwapTarget ? (
              <button
                type="button"
                disabled={submittingId != null}
                onClick={() => void handleUseInWorkout(exercise)}
                className="block w-full rounded-xl border border-[var(--border)] bg-forge-surface px-4 py-3 text-left transition-colors hover:border-forge-ember/50 disabled:opacity-60"
              >
                {cardBody}
              </button>
            ) : (
              <Link
                href={`/exercises/${exercise.id}${returnQuery}`}
                className="block rounded-xl border border-[var(--border)] bg-forge-surface px-4 py-3 transition-colors hover:border-forge-ember/50"
              >
                {cardBody}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
