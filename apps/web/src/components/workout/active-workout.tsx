"use client";

import {
  completeWorkoutSession,
  getSession,
  getSetsForSession,
  updateSet,
  type LocalExerciseSet,
  type LocalWorkoutSession,
} from "@forgefit/offline-sync";
import { useOfflineStatus } from "@/hooks/use-online-status";
import {
  appPagePadding,
  appSectionStackTight,
} from "@/components/layout/page-layout";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RestTimer } from "./rest-timer";
import { SetRow } from "./set-row";
import { useWorkoutSyncContext } from "./sync-manager";

interface ActiveWorkoutProps {
  clientId: string;
  onBack?: () => void;
  onFinished?: () => void | Promise<void>;
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
  const [cancelling, setCancelling] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const offline = useOfflineStatus();

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
    if (finishing || cancelling) return;
    setFinishing(true);
    setFinishError(null);
    setRestSeconds(null);

    try {
      await completeWorkoutSession(clientId, "completed");
      void sync?.refreshPending();
      if (navigator.onLine) {
        await sync?.runSync();
      }
      await onFinished?.();
      goBack();
    } catch {
      setFinishError("Could not save workout on this device. Try again.");
      setFinishing(false);
    }
  }

  async function handleCancel() {
    if (finishing || cancelling) return;
    const confirmed = window.confirm(
      "Discard this workout? Logged sets won't count toward your week."
    );
    if (!confirmed) return;

    setCancelling(true);
    setFinishError(null);
    setRestSeconds(null);

    try {
      await completeWorkoutSession(clientId, "cancelled");
      void sync?.refreshPending();
      if (navigator.onLine) {
        await sync?.runSync();
      }
      await onFinished?.();
      goBack();
    } catch {
      setFinishError("Could not discard workout on this device. Try again.");
      setCancelling(false);
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
    <div className={`${appPagePadding} pb-36`}>
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
        {offline && (
          <span className="ml-2 text-forge-steel">· Offline mode</span>
        )}
      </p>

      <div className={`mt-6 sm:mt-8 ${appSectionStackTight}`}>
        {session.exercises.map((exercise) => {
          const exerciseSets = setsByExercise.get(exercise.exerciseId) ?? [];
          return (
            <section
              key={exercise.exerciseId}
              className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-3 sm:p-4"
            >
              <div className="mb-4">
                <h2 className="font-display text-base font-semibold text-forge-text sm:text-lg">
                  <Link
                    href={`/exercises/${exercise.exerciseId}`}
                    className="hover:text-forge-ember"
                  >
                    {exercise.name}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-forge-muted">
                  Aim for {exercise.sets + (exercise.extraSets ?? 0)} sets of{" "}
                  {exercise.reps} reps · {exercise.restSeconds}s rest between
                  sets
                  {exercise.extraSets ? (
                    <span className="text-forge-gold">
                      {" "}
                      (+{exercise.extraSets} from progression)
                    </span>
                  ) : null}
                </p>
                {exercise.progressionNote && (
                  <p className="mt-2 rounded-lg border border-forge-steel/30 bg-forge-steel/5 px-3 py-2 text-xs text-forge-steel">
                    {exercise.progressionNote}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {exerciseSets.map((set) => (
                  <SetRow
                    key={set.clientId}
                    set={set}
                    targetReps={exercise.reps}
                    showProgressionHint={Boolean(
                      exercise.progressionNote &&
                        !set.completed &&
                        (set.weightKg != null || set.reps != null)
                    )}
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

      <div className="mt-8 space-y-3">
        <button
          type="button"
          disabled={finishing || cancelling}
          onClick={() => void handleFinish()}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-forge-ember font-display font-bold text-white disabled:opacity-60"
        >
          {finishing ? "Saving…" : "Finish workout"}
        </button>
        <button
          type="button"
          disabled={finishing || cancelling}
          onClick={() => void handleCancel()}
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[var(--border)] font-medium text-forge-muted transition-colors hover:border-forge-coral/40 hover:text-forge-coral disabled:opacity-60"
        >
          {cancelling ? "Discarding…" : "Discard workout"}
        </button>
      </div>

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
