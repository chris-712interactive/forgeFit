"use client";

import { cancelWorkoutSessionOnServer } from "@/app/actions/workouts";
import type { ProgramPlan } from "@forgefit/program-engine";
import {
  cacheProgramPlan,
  cancelInProgressSessionsForDay,
  getCachedProgramPlan,
  getSession,
  startWorkoutSession,
} from "@forgefit/offline-sync";
import { reconcileLocalWorkoutsWithServer } from "@/lib/workouts/reconcile-local";
import {
  buildDayStatusMap,
  mergeSessionRecords,
  type WorkoutSessionRecord,
} from "@/lib/workouts/sessions";
import { useUnitPreference } from "@/components/units/unit-preference-provider";
import { useOfflineStatus } from "@/hooks/use-online-status";
import { loadLocalSessionRecords } from "@/lib/workouts/sessions-local";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import { ExperiencePromotionBanner } from "@/components/progression/experience-promotion-banner";
import { TrainingConsistencyCard } from "@/components/progression/training-consistency-card";
import {
  buildSessionLoadProgressions,
  progressionToPrefill,
} from "@/lib/progression/rir-progression";
import type { WorkoutCoachingFeatures } from "@/lib/coaching/types";
import type { PromotionEvaluation } from "@/lib/progression/types";
import type { ExperienceLevel, FitnessGoal } from "@/lib/types/profile";
import {
  appPagePadding,
  appSectionStack,
  appSectionStackTight,
} from "@/components/layout/page-layout";
import { buildEvidenceHref } from "@/lib/evidence/present";
import { ActiveWorkout } from "./active-workout";
import { SyncStatusBanner } from "./sync-status-banner";
import { useWorkoutSyncContext } from "./sync-manager";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import { WeekPlanCard } from "./week-plan-card";
import { WorkoutHistoryList } from "./workout-history-list";
import { WorkoutRecap } from "./workout-recap";
import { WorkoutSyncNotice } from "./workout-sync-notice";

interface WorkoutHubProps {
  userId: string;
  programId?: string;
  plan: ProgramPlan | null;
  serverSessions?: WorkoutSessionRecord[];
  workoutsTableReady?: boolean;
  promotion?: PromotionEvaluation | null;
  experienceLevel?: ExperienceLevel;
  goal?: FitnessGoal;
  bodyweightKg?: number;
  declaredE1rmKg?: Record<string, number>;
  coachingFeatures?: WorkoutCoachingFeatures | null;
}

const OFFLINE_ACTIVE_KEY = "forgefit:active-workout";

function isOfflineNow() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

function persistActiveWorkout(clientId: string | null) {
  if (clientId) {
    sessionStorage.setItem(OFFLINE_ACTIVE_KEY, clientId);
  } else {
    sessionStorage.removeItem(OFFLINE_ACTIVE_KEY);
  }
}

function replaceWorkoutUrl(
  mode: "hub" | "active" | "review",
  clientId: string | null
) {
  if (isOfflineNow()) {
    if (mode === "active") {
      persistActiveWorkout(clientId);
    } else {
      persistActiveWorkout(null);
    }
    return;
  }

  persistActiveWorkout(null);
  let url = "/workout";
  if (mode === "active" && clientId) {
    url = `/workout?active=${clientId}`;
  } else if (mode === "review" && clientId) {
    url = `/workout?review=${clientId}`;
  }
  window.history.replaceState(window.history.state, "", url);
}

export function WorkoutHub({
  userId,
  programId,
  plan: serverPlan,
  serverSessions = [],
  workoutsTableReady = true,
  promotion = null,
  experienceLevel = "beginner",
  goal = "general_strength",
  bodyweightKg,
  declaredE1rmKg,
  coachingFeatures = null,
}: WorkoutHubProps) {
  const router = useRouter();
  const sync = useWorkoutSyncContext();
  const autoStarted = useRef(false);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [reviewClientId, setReviewClientId] = useState<string | null>(null);
  const [plan, setPlan] = useState<ProgramPlan | null>(serverPlan);
  const [cachedProgramId, setCachedProgramId] = useState<string | undefined>(programId);
  const [localSessions, setLocalSessions] = useState<WorkoutSessionRecord[]>([]);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [startingDay, setStartingDay] = useState<number | null>(null);
  const [discardingClientId, setDiscardingClientId] = useState<string | null>(
    null
  );
  const offline = useOfflineStatus();
  const unit = useUnitPreference();

  const allSessions = useMemo(
    () => mergeSessionRecords(localSessions, serverSessions),
    [localSessions, serverSessions]
  );

  const dayStatusMap = useMemo(() => buildDayStatusMap(allSessions), [allSessions]);

  const reviewSession = useMemo(() => {
    const session =
      allSessions.find((s) => s.clientId === reviewClientId) ?? null;
    if (!session || !plan) return session;

    const planSession = plan.week.find((s) => s.dayIndex === session.dayIndex);
    if (!planSession) return session;

    return {
      ...session,
      warmupBlock: session.warmupBlock ?? planSession.warmupBlock,
      recoveryBlock: session.recoveryBlock ?? planSession.recoveryBlock,
    };
  }, [allSessions, reviewClientId, plan]);

  const reviewDayStatus = useMemo(() => {
    if (!reviewSession) return undefined;
    return dayStatusMap.get(reviewSession.dayIndex);
  }, [dayStatusMap, reviewSession]);

  useEffect(() => {
    if (activeClientId || reviewClientId || !sync?.lastSyncedAt) return;
    router.refresh();
  }, [sync?.lastSyncedAt, activeClientId, reviewClientId, router]);

  useEffect(() => {
    async function hydrateFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const activeFromUrl = params.get("active");
      const reviewFromUrl = params.get("review");
      const fromStorage = sessionStorage.getItem(OFFLINE_ACTIVE_KEY);
      const activeClientIdCandidate =
        activeFromUrl ?? (isOfflineNow() ? fromStorage : null);

      if (reviewFromUrl) {
        setReviewClientId(reviewFromUrl);
        return;
      }

      if (!activeClientIdCandidate) return;

      const session = await getSession(activeClientIdCandidate);
      if (session?.status === "in_progress") {
        setActiveClientId(activeClientIdCandidate);
        return;
      }

      persistActiveWorkout(null);
      if (activeFromUrl && !isOfflineNow()) {
        window.history.replaceState(window.history.state, "", "/workout");
      }
    }

    void hydrateFromUrl();
  }, []);

  useEffect(() => {
    void import("@forgefit/offline-sync");
  }, []);

  const refreshSessions = useCallback(async () => {
    await reconcileLocalWorkoutsWithServer(
      userId,
      serverSessions.map((s) => s.clientId)
    );
    const local = await loadLocalSessionRecords(userId);
    setLocalSessions(local);
    setSessionsReady(true);
  }, [userId, serverSessions]);

  const refreshAllSessions = useCallback(async () => {
    await refreshSessions();
    router.refresh();
  }, [refreshSessions, router]);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

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
    setReviewClientId(null);
    setActiveClientId(clientId);
    replaceWorkoutUrl("active", clientId);
  }, []);

  const openReview = useCallback((clientId: string) => {
    setActiveClientId(null);
    setReviewClientId(clientId);
    replaceWorkoutUrl("review", clientId);
  }, []);

  const closeToHub = useCallback(() => {
    setActiveClientId(null);
    setReviewClientId(null);
    replaceWorkoutUrl("hub", null);
    void refreshSessions();
  }, [refreshSessions]);

  const handleStart = useCallback(
    async (dayIndex: number) => {
      if (!plan) return;
      const session = plan.week.find((s) => s.dayIndex === dayIndex);
      if (!session) return;

      const dayStatus = dayStatusMap.get(dayIndex);
      if (dayStatus?.inProgress) {
        openWorkout(dayStatus.inProgress.clientId);
        return;
      }
      if (dayStatus?.latestCompleted) {
        openReview(dayStatus.latestCompleted.clientId);
        return;
      }

      setStartingDay(dayIndex);
      try {
        const loadProgressions = buildSessionLoadProgressions({
          exercises: session.exercises,
          sessions: allSessions,
          experienceLevel,
          goal,
          bodyweightKg,
          declaredE1rmKg: declaredE1rmKg
            ? new Map(Object.entries(declaredE1rmKg))
            : undefined,
          unit,
        });

        const setPrefills: Record<
          string,
          {
            weightKg?: number;
            reps?: number;
            durationMs?: number;
          }
        > = {};
        for (const [exerciseId, progression] of loadProgressions) {
          setPrefills[exerciseId] = progressionToPrefill(progression, unit);
        }

        const clientId = await startWorkoutSession({
          userId,
          programId: cachedProgramId,
          sessionName: session.name,
          dayIndex: session.dayIndex,
          warmupBlock: session.warmupBlock,
          recoveryBlock: session.recoveryBlock,
          exercises: session.exercises.map((ex) => {
            const progression = loadProgressions.get(ex.exerciseId);
            return {
              exerciseId: ex.exerciseId,
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              restSeconds: ex.restSeconds,
              extraSets: progression?.extraSets,
              progressionNote: progression?.reason,
              notes: ex.notes,
            };
          }),
          setPrefills,
        });
        openWorkout(clientId);
      } finally {
        setStartingDay(null);
      }
    },
    [
      plan,
      cachedProgramId,
      dayStatusMap,
      openWorkout,
      openReview,
      userId,
      allSessions,
      experienceLevel,
      goal,
      bodyweightKg,
      declaredE1rmKg,
      unit,
    ]
  );

  const handleDiscard = useCallback(
    async (clientId: string) => {
      const confirmed = window.confirm(
        "Discard this in-progress workout? Logged sets won't count toward your week."
      );
      if (!confirmed) return;

      setDiscardingClientId(clientId);
      try {
        const mergedSession = allSessions.find(
          (session) => session.clientId === clientId
        );
        const localSession = await getSession(clientId);
        const dayIndex = localSession?.dayIndex ?? mergedSession?.dayIndex;

        if (dayIndex != null) {
          await cancelInProgressSessionsForDay(userId, dayIndex);
        }

        const serverResult = await cancelWorkoutSessionOnServer(clientId);
        if (serverResult.error) {
          window.alert(serverResult.error);
          return;
        }

        if (activeClientId === clientId) {
          setActiveClientId(null);
          replaceWorkoutUrl("hub", null);
        }

        void sync?.refreshPending();
        if (navigator.onLine) {
          await sync?.runSync();
        }
        await refreshAllSessions();
      } finally {
        setDiscardingClientId(null);
      }
    },
    [activeClientId, allSessions, refreshAllSessions, sync, userId]
  );

  useEffect(() => {
    if (autoStarted.current || activeClientId || reviewClientId || !plan) return;
    const dayParam = new URLSearchParams(window.location.search).get("day");
    if (!dayParam) return;
    const dayIndex = Number(dayParam);
    if (Number.isNaN(dayIndex)) return;
    if (!plan.week.some((s) => s.dayIndex === dayIndex)) return;
    autoStarted.current = true;
    void handleStart(dayIndex);
  }, [plan, handleStart, activeClientId, reviewClientId]);

  if (activeClientId) {
    return (
      <ActiveWorkout
        clientId={activeClientId}
        experienceLevel={experienceLevel}
        coaching={coachingFeatures}
        onBack={closeToHub}
        onFinished={refreshAllSessions}
      />
    );
  }

  if (reviewClientId) {
    if (!reviewSession) {
      return (
        <div className="px-6 py-8">
          <p className="text-forge-muted">
            {sessionsReady
              ? "Workout results not found."
              : "Loading workout results…"}
          </p>
          {sessionsReady && (
            <button
              type="button"
              onClick={closeToHub}
              className="mt-4 text-forge-ember"
            >
              Back to plan
            </button>
          )}
        </div>
      );
    }

    return (
      <WorkoutRecap
        session={reviewSession}
        dayStatus={reviewDayStatus}
        workoutsTableReady={workoutsTableReady}
        onBack={closeToHub}
      />
    );
  }

  return (
    <div className={appPagePadding}>
      <div className={appSectionStack}>
        <SyncStatusBanner />
        {!workoutsTableReady && (
          <WorkoutSyncNotice
            workoutsTableReady={workoutsTableReady}
            syncedToAccount={false}
          />
        )}

        <header>
          <h1 className="font-display text-2xl font-bold text-forge-text">
            Workout
          </h1>
          <p className="mt-2 text-forge-muted">
            Your weekly plan — completed days are highlighted in green. Tap
            results to compare with prior sessions.
          </p>
          {offline && (
            <p className="mt-2 text-sm text-forge-steel">
              Offline mode — progress is saved on this device and syncs when
              you&apos;re back online.
            </p>
          )}
        </header>

        {promotion?.showNudge && (
          <ExperiencePromotionBanner evaluation={promotion} />
        )}

        {promotion && !promotion.showNudge && promotion.nextLevel && (
          <TrainingConsistencyCard evaluation={promotion} />
        )}

        <PwaInstallPrompt />

        {plan ? (
          <section className={appSectionStackTight}>
            <div className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised px-4 py-3 sm:px-5">
              {plan.isDeloadWeek && (
                <p className="mb-2 text-sm font-medium text-forge-steel">
                  Deload week — reduced volume and lighter effort across
                  sessions.
                </p>
              )}
              <p className="text-sm text-forge-muted">
                Built from{" "}
                <span className="font-medium text-forge-text">
                  {plan.appliedRuleIds.length} evidence-backed rules
                </span>{" "}
                — volume, rest, recovery, and nutrition targets are cited, not
                guessed.
              </p>
              <div className="mt-2">
                <EvidenceExplainerLink
                  href={buildEvidenceHref()}
                  label="See your evidence basis"
                />
              </div>
            </div>

            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
              This week
            </h2>
            {plan.week.map((session) => (
              <WeekPlanCard
                key={`${session.dayIndex}-${session.name}`}
                session={session}
                dayStatus={dayStatusMap.get(session.dayIndex)}
                starting={startingDay === session.dayIndex}
                discarding={
                  discardingClientId ===
                  dayStatusMap.get(session.dayIndex)?.inProgress?.clientId
                }
                onStart={() => void handleStart(session.dayIndex)}
                onContinue={openWorkout}
                onDiscard={(clientId) => void handleDiscard(clientId)}
                onViewResults={openReview}
              />
            ))}

            <div className="pt-2">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
                History
              </h2>
              <p className="mt-1 text-sm text-forge-muted">
                Past completed workouts — open any session to review sets and
                compare progress.
              </p>
              <div className="mt-3">
                <WorkoutHistoryList
                  sessions={allSessions}
                  onViewResults={openReview}
                />
              </div>
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
            <p className="text-forge-muted">
              {offline
                ? "No cached program yet. Visit Workout once while online to save your plan for offline use."
                : "Generate your program first — complete onboarding and apply the programs migration."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
