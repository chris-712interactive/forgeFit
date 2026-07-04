"use client";

import { swapExerciseInSession } from "@forgefit/offline-sync";
import { parseWorkoutSwapReturnTo } from "@/lib/workouts/exercise-swap-return";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ExerciseWorkoutSwapActionProps {
  exerciseId: string;
  exerciseName: string;
  returnTo?: string | null;
}

export function ExerciseWorkoutSwapAction({
  exerciseId,
  exerciseName,
  returnTo,
}: ExerciseWorkoutSwapActionProps) {
  const router = useRouter();
  const target = parseWorkoutSwapReturnTo(returnTo);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!target) return null;

  async function handleUseInWorkout() {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await swapExerciseInSession({
        sessionClientId: target!.clientId,
        exerciseIndex: target!.exerciseIndex,
        newExerciseId: exerciseId,
        newExerciseName: exerciseName,
        reason: "user_choice",
      });
      if (!updated) {
        setError("Could not apply this swap to your active workout.");
        setSubmitting(false);
        return;
      }
      router.push(`/workout?active=${encodeURIComponent(target!.clientId)}`);
    } catch {
      setError("Could not apply this swap on this device.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-forge-ember/30 bg-forge-ember/5 p-4">
      <p className="text-sm font-medium text-forge-text">
        Use this exercise in your active workout?
      </p>
      <button
        type="button"
        disabled={submitting}
        onClick={() => void handleUseInWorkout()}
        className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white disabled:opacity-60"
      >
        {submitting ? "Applying…" : "Use in workout"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-forge-coral" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
