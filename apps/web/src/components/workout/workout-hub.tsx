"use client";

import type { ProgramPlan } from "@forgefit/program-engine";
import {
  cacheProgramPlan,
  getCachedProgramPlan,
  getInProgressSessions,
  getSession,
  getSetsForSession,
  listSessionsForUser,
  startWorkoutSession,
  type LocalWorkoutSession,
} from "@forgefit/offline-sync";
import type { WorkoutHistoryItem } from "@/lib/workouts/history";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActiveWorkout } from "./active-workout";
import { SyncStatusBanner } from "./sync-status-banner";
import { useWorkoutSyncContext } from "./sync-manager";
import { WorkoutHistory } from "./workout-history";

interface WorkoutHubProps {
  userId: string;
  programId?: string;
  plan: ProgramPlan | null;
  history?: WorkoutHistoryItem[];
}

const OFFLINE_ACTIVE_KEY = "forgefit:active-workout";

async function loadLocalHistory(
  userId: string,
  limit = 10
): Promise<WorkoutHistoryItem[]> {
  const sessions = await listSessionsForUser(userId);
  const finished = sessions.filter((s) => s.status !== "in_progress").slice(0, limit);

  return Promise.all(
    finished.map(async (session) => {
      const sets = await getSetsForSession(session.clientId);
      return {
        id: session.clientId,
        sessionName: session.sessionName,
        status: session.status,
        startedAt: session.startedAt,
        completedAt: session.completedAt ?? null,
        setCount: sets.length,
        completedSetCount: sets.filter((s) => s.completed).length,
        pendingSync: !session.synced,
      };
    })
  );
}

function mergeHistory(
  server: WorkoutHistoryItem[],
  local: WorkoutHistoryItem[]
): WorkoutHistoryItem[] {
  const seen = new Set(
    server.map((item) => `${item.sessionName}:${item.startedAt}`)
  );
  const merged = [
    ...server,
    ...local.filter((item) => !seen.has(`${item.sessionName}:${item.startedAt}`)),
  ];
  return merged
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 10);
}

function isOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

function persistActiveWorkout(clientId: string | null) {
  if (clientId) {
    sessionStorage.setItem(OFFLINE_ACTIVE_KEY, clientId);
  } else {
    sessionStorage.removeItem(OFFLINE_ACTIVE_KEY);
  }
}

function replaceWorkoutUrl(clientId: string | null) {
  // Avoid history.replaceState offline — it can trigger Next.js / SW fetches
  // that fail without network and crash the active workout view.
  if (isOffline()) {
    persistActiveWorkout(clientId);
    return;
  }

  persistActiveWorkout(null);
  const url = clientId ? `/workout?active=${clientId}` : "/workout";
  window.history.replaceState(window.history.state, "", url);
}

export function WorkoutHub({
  userId,
  programId,
  plan: serverPlan,
  history = [],
}: WorkoutHubProps) {
  const router = useRouter();
  const sync = useWorkoutSyncContext();
  const autoStarted = useRef(false);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [plan, setPlan] = useState<ProgramPlan | null>(serverPlan);
  const [cachedProgramId, setCachedProgramId] = useState<string | undefined>(programId);
  const [inProgress, setInProgress] = useState<LocalWorkoutSession[]>([]);
  const [localHistory, setLocalHistory] = useState<WorkoutHistoryItem[]>([]);
  const [startingDay, setStartingDay] = useState<number | null>(null);

  useEffect(() => {
    if (activeClientId || !sync?.lastSyncedAt) return;
    router.refresh();
  }, [sync?.lastSyncedAt, activeClientId, router]);

  // Hydrate only in-progress sessions — ignore stale ?active= after finish.
  useEffect(() => {
    async function hydrateActiveSession() {
      const fromUrl = new URLSearchParams(window.location.search).get("active");
      const fromStorage = sessionStorage.getItem(OFFLINE_ACTIVE_KEY);
      const clientId = fromUrl ?? (isOffline() ? fromStorage : null);
      if (!clientId) return;

      const session = await getSession(clientId);
      if (session?.status === "in_progress") {
        setActiveClientId(clientId);
        return;
      }

      persistActiveWorkout(null);
      if (fromUrl && !isOffline()) {
        window.history.replaceState(window.history.state, "", "/workout");
      }
    }

    void hydrateActiveSession();
  }, []);

  // Warm lazy chunks while online so Turbopack doesn't fetch them mid-workout.
  useEffect(() => {
    void import("@forgefit/offline-sync");
  }, []);

  const refreshWorkoutLists = useCallback(async () => {
    const [sessions, completed] = await Promise.all([
      getInProgressSessions(userId),
      loadLocalHistory(userId),
    ]);
    setInProgress(sessions);
    setLocalHistory(completed);
  }, [userId]);

  useEffect(() => {
    void refreshWorkoutLists();
  }, [refreshWorkoutLists]);

  useEffect(() => {
    if (serverPlan) {
      setPlan(serverPlan);
      setCachedProgramId(programId);
      void cacheProgramPlan(userId, serverPlan, programId);
      return;
    }

    void getCachedProgramPlan(userId).then((cached) => {
      if (cached) {
        setPlan(cached.plan);
        setCachedProgramId(cached.programId);
      }
    });
  }, [serverPlan, programId, userId]);

  const openWorkout = useCallback((clientId: string) => {
    setActiveClientId(clientId);
    replaceWorkoutUrl(clientId);
  }, []);

  const closeWorkout = useCallback(() => {
    setActiveClientId(null);
    replaceWorkoutUrl(null);
    void refreshWorkoutLists();
  }, [refreshWorkoutLists]);

  const handleStart = useCallback(
    async (dayIndex: number) => {
      if (!plan) return;
      const session = plan.week.find((s) => s.dayIndex === dayIndex);
      if (!session) return;

      setStartingDay(dayIndex);
      try {
        const clientId = await startWorkoutSession({
          userId,
          programId: cachedProgramId,
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
        openWorkout(clientId);
      } finally {
        setStartingDay(null);
      }
    },
    [plan, cachedProgramId, openWorkout, userId]
  );

  useEffect(() => {
    if (autoStarted.current || activeClientId || !plan) return;
    const dayParam = new URLSearchParams(window.location.search).get("day");
    if (!dayParam) return;
    const dayIndex = Number(dayParam);
    if (Number.isNaN(dayIndex)) return;
    if (!plan.week.some((s) => s.dayIndex === dayIndex)) return;
    autoStarted.current = true;
    void handleStart(dayIndex);
  }, [plan, handleStart, activeClientId]);

  if (activeClientId) {
    return (
      <ActiveWorkout
        clientId={activeClientId}
        onBack={closeWorkout}
        onFinished={refreshWorkoutLists}
      />
    );
  }

  const offline = isOffline();

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <SyncStatusBanner />
      <h1 className="font-display text-2xl font-bold text-forge-text">Workout</h1>
      <p className="mt-2 text-forge-muted">
        Log sets offline in the gym — syncs when you&apos;re back online.
      </p>
      {offline && (
        <p className="mt-2 text-sm text-forge-steel">
          Offline mode — resume in-progress workouts or start from your cached
          plan.
        </p>
      )}

      {inProgress.length > 0 && (
        <section className="mt-6 space-y-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-gold">
            Resume
          </h2>
          {inProgress.map((session) => (
            <button
              key={session.clientId}
              type="button"
              onClick={() => openWorkout(session.clientId)}
              className="flex w-full items-center justify-between rounded-2xl border border-forge-ember/30 bg-forge-ember/10 p-4 text-left"
            >
              <div>
                <p className="font-display font-semibold text-forge-text">
                  {session.sessionName}
                </p>
                <p className="text-sm text-forge-muted">Tap to continue</p>
              </div>
              <span className="text-sm font-semibold text-forge-ember">→</span>
            </button>
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
            {offline
              ? "No cached program yet. Visit Workout once while online to save your plan for offline use."
              : "Generate your program first — complete onboarding and apply the programs migration."}
          </p>
        </div>
      )}

      <WorkoutHistory items={mergeHistory(history, localHistory)} />
    </div>
  );
}
