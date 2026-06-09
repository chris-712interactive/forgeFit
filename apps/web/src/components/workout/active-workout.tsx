"use client";

import {
  completeWorkoutSession,
  getSession,
  getSetsForSession,
  syncWorkoutData,
  updateSet,
  type LocalExerciseSet,
  type LocalWorkoutSession,
} from "@forgefit/offline-sync";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RestTimer } from "./rest-timer";
import { SetRow } from "./set-row";

interface ActiveWorkoutProps {
  clientId: string;
  userId: string;
  onBack?: () => void;
}

export function ActiveWorkout({ clientId, userId, onBack }: ActiveWorkoutProps) {
  function goBack() {
    onBack?.();
  }
  const [session, setSession] = useState<LocalWorkoutSession | null>(null);
  const [sets, setSets] = useState<LocalExerciseSet[]>([]);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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

    if (navigator.onLine) {
      try {
        await syncWorkoutData(userId);
      } catch {
        // Offline-first: data stays in Dexie until next sync.
      }
    }
  }

  async function handleFinish() {
    await completeWorkoutSession(clientId, "completed");
    if (navigator.onLine) {
      try {
        await syncWorkoutData(userId);
      } catch {
        // Queued locally until reconnect.
      }
    }
    goBack();
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
    <div className="px-6 py-8 pb-32">
      <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
        {session.status === "in_progress" ? "In progress" : session.status}
      </p>
      <h1 className="font-display text-2xl font-bold text-forge-text">
        {session.sessionName}
      </h1>
      <p className="mt-2 text-sm text-forge-muted">
        {completedCount}/{totalCount} sets logged
        {!navigator.onLine && (
          <span className="ml-2 text-forge-steel">· Offline mode</span>
        )}
      </p>

      <div className="mt-6 space-y-6">
        {session.exercises.map((exercise) => {
          const exerciseSets = setsByExercise.get(exercise.exerciseId) ?? [];
          return (
            <section
              key={exercise.exerciseId}
              className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4"
            >
              <div className="mb-3">
                <h2 className="font-display font-semibold text-forge-text">
                  {exercise.name}
                </h2>
                <p className="text-sm text-forge-muted">
                  Target {exercise.sets}×{exercise.reps} · {exercise.restSeconds}s
                  rest
                </p>
              </div>

              <div className="mb-2 grid grid-cols-[2rem_1fr_1fr_3rem_3rem] gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-forge-muted">
                <span>Set</span>
                <span>kg</span>
                <span>Reps</span>
                <span>RIR</span>
                <span />
              </div>

              <div className="space-y-2">
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

      <button
        type="button"
        onClick={() => void handleFinish()}
        className="mt-8 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-forge-ember font-display font-bold text-white"
      >
        Finish workout
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
