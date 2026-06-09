"use client";

import type { ProgramPlan } from "@forgefit/program-engine";
import {
  getInProgressSessions,
  startWorkoutSession,
  type LocalWorkoutSession,
} from "@forgefit/offline-sync";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface WorkoutHubProps {
  userId: string;
  programId?: string;
  plan: ProgramPlan | null;
}

export function WorkoutHub({ userId, programId, plan }: WorkoutHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoStarted = useRef(false);
  const [inProgress, setInProgress] = useState<LocalWorkoutSession[]>([]);
  const [startingDay, setStartingDay] = useState<number | null>(null);

  useEffect(() => {
    void getInProgressSessions(userId).then(setInProgress);
  }, [userId]);

  const handleStart = useCallback(
    async (dayIndex: number) => {
      if (!plan) return;
      const session = plan.week.find((s) => s.dayIndex === dayIndex);
      if (!session) return;

      setStartingDay(dayIndex);
      try {
        const clientId = await startWorkoutSession({
          userId,
          programId,
          sessionName: session.name,
          dayIndex: session.dayIndex,
          exercises: session.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
          })),
        });
        router.push(`/workout/${clientId}`);
      } finally {
        setStartingDay(null);
      }
    },
    [plan, programId, router, userId]
  );

  useEffect(() => {
    const dayParam = searchParams.get("day");
    if (!dayParam || !plan || autoStarted.current) return;
    const dayIndex = Number(dayParam);
    if (Number.isNaN(dayIndex)) return;
    if (!plan.week.some((s) => s.dayIndex === dayIndex)) return;
    autoStarted.current = true;
    void handleStart(dayIndex);
  }, [searchParams, plan, handleStart]);

  return (
    <div className="px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-forge-text">Workout</h1>
      <p className="mt-2 text-forge-muted">
        Log sets offline in the gym — syncs when you&apos;re back online.
      </p>

      {inProgress.length > 0 && (
        <section className="mt-6 space-y-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-gold">
            Resume
          </h2>
          {inProgress.map((session) => (
            <Link
              key={session.clientId}
              href={`/workout/${session.clientId}`}
              className="flex items-center justify-between rounded-2xl border border-forge-ember/30 bg-forge-ember/10 p-4"
            >
              <div>
                <p className="font-display font-semibold text-forge-text">
                  {session.sessionName}
                </p>
                <p className="text-sm text-forge-muted">Tap to continue</p>
              </div>
              <span className="text-sm font-semibold text-forge-ember">→</span>
            </Link>
          ))}
        </section>
      )}

      {plan ? (
        <section className="mt-6 space-y-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
            This week
          </h2>
          {plan.week.map((session) => (
            <article
              key={`${session.dayIndex}-${session.name}`}
              className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
                    {session.dayLabel}
                  </p>
                  <h3 className="font-display font-semibold text-forge-text">
                    {session.name}
                  </h3>
                  <p className="mt-1 text-sm text-forge-muted">
                    {session.exercises.length} exercises · ~
                    {session.estimatedMinutes} min
                  </p>
                </div>
                <button
                  type="button"
                  disabled={startingDay === session.dayIndex}
                  onClick={() => void handleStart(session.dayIndex)}
                  className="shrink-0 rounded-lg bg-forge-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {startingDay === session.dayIndex ? "Starting…" : "Start"}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-forge-muted">
            Generate your program first — complete onboarding and apply the
            programs migration.
          </p>
        </div>
      )}
    </div>
  );
}
