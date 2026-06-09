"use client";

import {
  completeWorkoutSession,
  getSession,
  getSetsForSession,
  updateSet,
  type LocalExerciseSet,
  type LocalWorkoutSession,
} from "@forgefit/offline-sync";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RestTimer } from "./rest-timer";
import { SetRow } from "./set-row";
import { useWorkoutSyncContext } from "./sync-manager";

interface ActiveWorkoutProps {
  clientId: string;
  onBack?: () => void;
  onFinished?: () => void;
}

export function ActiveWorkout({
  clientId,
  onBack,
  onFinished,
}: ActiveWorkoutProps) {
  const sync = useWorkoutSyncContext();
  const [session, setSession] = useState<LocalWorkoutSession | null>(null);
  const [sets, setSets] = useState<LocalExerciseSet[]>([]);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const goBack = useCallback(() => {
    onBack?.();
  }, [onBack]);

  const load = useCallback(async () => {
    const [sessionRow, setRows] = await Promise.all([
      getSession(clientId),
      getSetsForSession(clientId),
    ]);
    setSession(sessionRow ?? null);
    setSets(setRows);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setsByExercise = useMemo(() => {
    const map = new Map<string, LocalExerciseSet[]>();
    for (const set of sets) {
      const group = map.get(set.exerciseId) ?? [];
      group.push(set);
      map.set(set.exerciseId, group);
    }
    return map;
  }, [sets]);

  const completedCount = sets.filter((s) => s.completed).length;
  const totalCount = sets.length;

  async function handleSetUpdate(
    setClientId: string,
    patch: Partial<Pick<LocalExerciseSet, "reps" | "weightKg" | "rir" | "completed">>
  ) {
    const wasCompleted = sets.find((s) => s.clientId === setClientId)?.completed;
    const completing = patch.completed === true && !wasCompleted;

    const updated = await updateSet(setClientId, {
      ...patch,
      completedAt:
        patch.completed === true
          ? new Date().toISOString()
          : patch.completed === false
            ? undefined
            : undefined,
    });

    if (updated) {
      setSets((prev) =>
        prev.map((s) => (s.clientId === setClientId ? updated : s))
      );
    }

    if (completing && session) {
      const setRow = sets.find((s) => s.clientId === setClientId);
      const exercise = session.exercises.find(
        (e) => e.exerciseId === setRow?.exerciseId
      );
      if (exercise?.restSeconds) {
        setRestSeconds(exercise.restSeconds);
      }
    }

    void sync?.refreshPending();
    if (navigator.onLine) {
      void sync?.runSync();
    }
  }

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    setFinishError(null);
    setRestSeconds(null);

    try {
      await completeWorkoutSession(clientId, "completed");
      onFinished?.();
      goBack();
      void sync?.refreshPending();
      void sync?.runSync();
    } catch {
      setFinishError("Could not save workout on this device. Try again.");
      setFinishing(false);
    }
  }

  if (loading) {
    return <p className="px-6 py-8 text-forge-muted">Loading workout…</p>;
  }

  if (!session) {
    return (
      <div className="px-6 py-8">
        <p className="text-forge-muted">Workout not found.</p>
        <button
          type="button"
          onClick={goBack}
          className="mt-4 text-forge-ember"
        >
          Back to workouts
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-36 sm:px-6 sm:py-8">
      <button
        type="button"
        onClick={goBack}
        className="mb-4 text-sm font-medium text-forge-steel"
      >
        ← Back to workouts
      </button>

      <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
        {session.status === "in_progress" ? "In progress" : session.status}
      </p>
      <h1 className="font-display text-xl font-bold text-forge-text sm:text-2xl">
        {session.sessionName}
      </h1>
      <p className="mt-2 text-sm text-forge-muted">
        {completedCount}/{totalCount} sets logged
        {!navigator.onLine && (
          <span className="ml-2 text-forge-steel">· Offline mode</span>
        )}
      </p>

      <div className="mt-6 space-y-5">
        {session.exercises.map((exercise) => {
          const exerciseSets = setsByExercise.get(exercise.exerciseId) ?? [];
          return (
            <section
              key={exercise.exerciseId}
              className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-3 sm:p-4"
            >
              <div className="mb-4">
                <h2 className="font-display text-base font-semibold text-forge-text sm:text-lg">
                  {exercise.name}
                </h2>
                <p className="mt-1 text-sm text-forge-muted">
                  Aim for {exercise.sets} sets of {exercise.reps} reps ·{" "}
                  {exercise.restSeconds}s rest between sets
                </p>
              </div>

              <div className="space-y-3">
                {exerciseSets.map((set) => (
                  <SetRow
                    key={set.clientId}
                    set={set}
                    targetReps={exercise.reps}
                    onUpdate={handleSetUpdate}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {finishError && (
        <p className="mt-4 text-sm text-forge-coral" role="alert">
          {finishError}
        </p>
      )}

      <button
        type="button"
        disabled={finishing}
        onClick={() => void handleFinish()}
        className="mt-8 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-forge-ember font-display font-bold text-white disabled:opacity-60"
      >
        {finishing ? "Saving…" : "Finish workout"}
      </button>

      {restSeconds !== null && restSeconds > 0 && (
        <RestTimer
          seconds={restSeconds}
          onComplete={() => setRestSeconds(null)}
          onSkip={() => setRestSeconds(null)}
        />
      )}
    </div>
  );
}
