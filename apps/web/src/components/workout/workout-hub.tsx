"use client";

import { cancelWorkoutSessionOnServer } from "@/app/actions/workouts";
import { saveWorkoutScheduleOverrides } from "@/app/actions/workout-schedule";
import { readActionError } from "@/lib/auth/action-result";
import type { ProgramPlan, WorkoutSession } from "@forgefit/program-engine";
import {
  cacheProgramPlan,
  cancelInProgressSessionsForDay,
  cancelWorkoutSession,
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
import {
  compareSessionsByEffectiveDate,
  canStartPlanSessionWithOverrides,
  type WorkoutScheduleOverride,
} from "@/lib/workouts/schedule-overrides";
import {
  loadLocalScheduleOverrides,
  mergeScheduleOverrideLists,
  persistLocalScheduleOverrides,
  syncScheduleOverridesWithServer,
} from "@/lib/workouts/schedule-overrides-local";
import { useUnitPreference } from "@/components/units/unit-preference-provider";
import { useOfflineStatus } from "@/hooks/use-online-status";
import { loadLocalSessionRecords } from "@/lib/workouts/sessions-local";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CollapsibleSection } from "@/components/layout/collapsible-section";
import { EvidenceExplainerLink } from "@/components/evidence/evidence-explainer-link";
import {
  buildSessionLoadProgressions,
  progressionToPrefill,
} from "@/lib/progression/rir-progression";
import { finishWorkoutCommunitySync } from "@/app/actions/gamification";
import type {
  LeaderboardRankDelta,
  WorkoutCoachingFeatures,
} from "@/lib/coaching/types";
import type { ExperienceLevel, FitnessGoal } from "@/lib/types/profile";
import type { WorkoutDeviceMetricsRecord, WorkoutReadinessContext } from "@/lib/workouts/device-metrics-types";
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
import { ScheduleAdjustSheet } from "./schedule-adjust-sheet";
import { WorkoutHistoryList } from "./workout-history-list";
import { WorkoutRecap } from "./workout-recap";
import { WorkoutSyncNotice } from "./workout-sync-notice";
import { CustomWorkoutCard } from "./custom-workout-card";
import {
  CustomWorkoutBuilder,
  type CustomWorkoutDraft,
} from "./custom-workout-builder";

interface WorkoutHubProps {
  userId: string;
  programId?: string;
  plan: ProgramPlan | null;
  userEquipment?: string[];
  serverSessions?: WorkoutSessionRecord[];
  serverScheduleOverrides?: WorkoutScheduleOverride[];
  scheduleOverridesTableReady?: boolean;
  workoutsTableReady?: boolean;
  experienceLevel?: ExperienceLevel;
  goal?: FitnessGoal;
  bodyweightKg?: number;
  declaredE1rmKg?: Record<string, number>;
  coachingFeatures?: WorkoutCoachingFeatures | null;
  deviceMetricsByClientId?: Map<string, WorkoutDeviceMetricsRecord>;
  fitbitConnected?: boolean;
  spotifyConnected?: boolean;
  readiness?: WorkoutReadinessContext | null;
  canCustomWorkouts?: boolean;
  canImportWorkouts?: boolean;
  workoutTemplates?: Array<{
    id: string;
    name: string;
    exercises: Array<{
      exerciseId: string;
      name: string;
      sets: number;
      reps: string;
      restSeconds: number;
    }>;
    warmup?: import("@forgefit/program-engine").WarmupBlock | null;
  }>;
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
  userEquipment = ["bodyweight_only"],
  serverSessions = [],
  serverScheduleOverrides = [],
  scheduleOverridesTableReady = true,
  workoutsTableReady = true,
  experienceLevel = "beginner",
  goal = "general_strength",
  bodyweightKg,
  declaredE1rmKg,
  coachingFeatures = null,
  deviceMetricsByClientId = new Map(),
  fitbitConnected = false,
  spotifyConnected = false,
  readiness = null,
  canCustomWorkouts = false,
  canImportWorkouts = false,
  workoutTemplates = [],
}: WorkoutHubProps) {
  const router = useRouter();
  const sync = useWorkoutSyncContext();
  const autoStarted = useRef(false);
  const scheduleSyncedRef = useRef(false);
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
  const [scheduleOverrides, setScheduleOverrides] = useState<
    WorkoutScheduleOverride[]
  >(serverScheduleOverrides);
  const [overridesReady, setOverridesReady] = useState(false);
  const [adjustingSession, setAdjustingSession] =
    useState<WorkoutSession | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [finishRankDelta, setFinishRankDelta] =
    useState<LeaderboardRankDelta | null>(null);
  const [customBuilderOpen, setCustomBuilderOpen] = useState(false);
  const [customBuilderDraft, setCustomBuilderDraft] =
    useState<CustomWorkoutDraft | null>(null);
  const offline = useOfflineStatus();
  const unit = useUnitPreference();

  const allSessions = useMemo(
    () => mergeSessionRecords(localSessions, serverSessions),
    [localSessions, serverSessions]
  );

  const sortedPlanSessions = useMemo(() => {
    if (!plan) return [];
    return [...plan.week].sort((a, b) =>
      compareSessionsByEffectiveDate(a, b, plan, scheduleOverrides)
    );
  }, [plan, scheduleOverrides]);

  const refreshScheduleOverrides = useCallback(async () => {
    const local = await loadLocalScheduleOverrides(userId);
    setScheduleOverrides(mergeScheduleOverrideLists(local, serverScheduleOverrides));
    setOverridesReady(true);
  }, [serverScheduleOverrides, userId]);

  useEffect(() => {
    void refreshScheduleOverrides();
  }, [refreshScheduleOverrides]);

  useEffect(() => {
    if (!overridesReady || !plan || scheduleSyncedRef.current) return;
    scheduleSyncedRef.current = true;

    void syncScheduleOverridesWithServer({
      userId,
      programId: cachedProgramId,
    }).then(async (result) => {
      if (!result.ok) return;
      await refreshScheduleOverrides();
      if (navigator.onLine) {
        router.refresh();
      }
    });
  }, [cachedProgramId, overridesReady, plan, refreshScheduleOverrides, router, userId]);

  const dayStatusMap = useMemo(
    () => buildDayStatusMap(allSessions, plan),
    [allSessions, plan]
  );

  const reviewSession = useMemo(() => {
    const session =
      allSessions.find((s) => s.clientId === reviewClientId) ?? null;
    if (!session || !plan) return session;

    if (session.dayIndex < 0 || session.sessionSource === "custom" || session.sessionSource === "imported") {
      return session;
    }

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
      void cacheProgramPlan(userId, serverPlan, programId, userEquipment);
      return;
    }

    void getCachedProgramPlan(userId).then((cached) => {
      if (cached) {
        setPlan(cached.plan);
        setCachedProgramId(cached.programId);
      }
    });
  }, [serverPlan, programId, userId, userEquipment]);

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
    setFinishRankDelta(null);
    replaceWorkoutUrl("hub", null);
    void refreshSessions();
  }, [refreshSessions]);

  const handleWorkoutFinished = useCallback(
    async (clientId: string) => {
      await refreshAllSessions();

      let rankDelta: LeaderboardRankDelta | null = null;
      if (navigator.onLine) {
        const result = await finishWorkoutCommunitySync();
        if (result.ok) {
          rankDelta = result.rankDelta ?? null;
        }
      }

      setFinishRankDelta(rankDelta);
      setActiveClientId(null);
      setReviewClientId(clientId);
      replaceWorkoutUrl("review", clientId);
    },
    [refreshAllSessions]
  );

  const handleStart = useCallback(
    async (dayIndex: number) => {
      if (!plan) return;
      const session = plan.week.find((s) => s.dayIndex === dayIndex);
      if (!session) return;
      if (!canStartPlanSessionWithOverrides(dayIndex, plan, scheduleOverrides)) return;

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
          conditioningBlock: session.conditioningBlock,
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

        if (navigator.onLine && spotifyConnected) {
          void (async () => {
            const response = await fetch("/api/integrations/spotify/autostart", {
              method: "POST",
            });
            const body = (await response.json()) as {
              ok?: boolean;
              reason?: string;
            };

            if (body.ok) return;
            if (body.reason === "no_active_device") {
              const { wakeSpotifyAndStartPlayback } = await import(
                "@/lib/workout-music/spotify-wake-playback"
              );
              await wakeSpotifyAndStartPlayback();
            }
          })();
        }
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
      spotifyConnected,
      scheduleOverrides,
    ]
  );

  const handleSaveSchedule = useCallback(
    async (nextOverrides: WorkoutScheduleOverride[]) => {
      if (!plan) return;
      setSavingSchedule(true);
      try {
        await persistLocalScheduleOverrides({
          userId,
          programId: cachedProgramId,
          overrides: nextOverrides,
        });
        setScheduleOverrides(nextOverrides);

        if (navigator.onLine) {
          const result = await saveWorkoutScheduleOverrides({
            programId: cachedProgramId,
            overrides: nextOverrides,
          });
          const actionError = readActionError(result);
          if (actionError) {
            window.alert(actionError);
            return;
          }
          await syncScheduleOverridesWithServer({
            userId,
            programId: cachedProgramId,
          });
          router.refresh();
        }

        setAdjustingSession(null);
      } finally {
        setSavingSchedule(false);
      }
    },
    [cachedProgramId, plan, router, userId]
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

        if (dayIndex != null && dayIndex >= 0) {
          await cancelInProgressSessionsForDay(userId, dayIndex);
        } else if (localSession) {
          await cancelWorkoutSession(clientId);
        }

        const serverResult = await cancelWorkoutSessionOnServer(clientId);
        const actionError = readActionError(serverResult);
        if (actionError) {
          window.alert(actionError);
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
        userEquipment={userEquipment}
        experienceLevel={experienceLevel}
        coaching={coachingFeatures}
        readiness={readiness}
        spotifyConnected={spotifyConnected}
        onBack={closeToHub}
        onFinished={handleWorkoutFinished}
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
        deviceMetrics={deviceMetricsByClientId.get(reviewSession.clientId) ?? null}
        fitbitConnected={fitbitConnected}
        rankDelta={finishRankDelta}
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
          <p className="mt-1 text-sm text-forge-muted">
            This week&apos;s plan — tap a day to start or review.
          </p>
          {offline && (
            <p className="mt-2 text-sm text-forge-steel">
              Offline mode — progress is saved on this device and syncs when
              you&apos;re back online.
            </p>
          )}
        </header>

        <PwaInstallPrompt />

        <CustomWorkoutCard
          canUseCustomWorkouts={canCustomWorkouts}
          templateCount={workoutTemplates.length}
          onOpenBuilder={() => {
            setCustomBuilderDraft(null);
            setCustomBuilderOpen(true);
          }}
        />

        {plan ? (
          <section className={appSectionStackTight}>
            {plan.isDeloadWeek && (
              <p className="rounded-xl border border-forge-steel/30 bg-forge-surface-raised px-4 py-2 text-sm font-medium text-forge-steel">
                Deload week — reduced volume and lighter effort.
              </p>
            )}

            <CollapsibleSection
              title="Evidence basis"
              hint={`${plan.appliedRuleIds.length} rules applied`}
            >
              <p className="text-sm text-forge-muted">
                Volume, rest, recovery, and nutrition targets are cited from
                evidence-backed rules — not guessed.
              </p>
              <div className="mt-2">
                <EvidenceExplainerLink
                  href={buildEvidenceHref()}
                  label="See your evidence basis"
                />
              </div>
            </CollapsibleSection>

            {!scheduleOverridesTableReady && (
              <p className="rounded-xl border border-forge-steel/30 bg-forge-surface-raised px-4 py-2 text-sm text-forge-steel">
                Schedule adjustments need a database migration — workouts still
                follow your default plan days until it is applied.
              </p>
            )}

            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
              This week
            </h2>
            {sortedPlanSessions.map((session) => (
              <WeekPlanCard
                key={`${session.dayIndex}-${session.name}`}
                plan={plan}
                session={session}
                dayStatus={dayStatusMap.get(session.dayIndex)}
                scheduleOverrides={scheduleOverrides}
                starting={startingDay === session.dayIndex}
                discarding={
                  discardingClientId ===
                  dayStatusMap.get(session.dayIndex)?.inProgress?.clientId
                }
                onStart={() => void handleStart(session.dayIndex)}
                onContinue={openWorkout}
                onDiscard={(clientId) => void handleDiscard(clientId)}
                onViewResults={openReview}
                onAdjustSchedule={
                  scheduleOverridesTableReady
                    ? () => setAdjustingSession(session)
                    : undefined
                }
              />
            ))}

            {adjustingSession && (
              <ScheduleAdjustSheet
                open
                plan={plan}
                session={adjustingSession}
                dayStatus={dayStatusMap.get(adjustingSession.dayIndex)}
                overrides={scheduleOverrides}
                saving={savingSchedule}
                onClose={() => setAdjustingSession(null)}
                onSave={(nextOverrides) => void handleSaveSchedule(nextOverrides)}
              />
            )}

            <CollapsibleSection
              title="Workout history"
              hint={`${allSessions.filter((s) => s.status === "completed").length} completed`}
            >
              <WorkoutHistoryList
                sessions={allSessions}
                canExportWorkouts={canCustomWorkouts}
                onViewResults={openReview}
              />
            </CollapsibleSection>
          </section>
        ) : (
          <section className={appSectionStackTight}>
            <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
              <p className="text-forge-muted">
                {offline
                  ? "No cached program yet. Visit Workout once while online to save your plan for offline use."
                  : "Generate your program first — complete onboarding and apply the programs migration."}
              </p>
            </div>

            <CollapsibleSection
              title="Workout history"
              hint={`${allSessions.filter((s) => s.status === "completed").length} completed`}
            >
              <WorkoutHistoryList
                sessions={allSessions}
                canExportWorkouts={canCustomWorkouts}
                onViewResults={openReview}
              />
            </CollapsibleSection>
          </section>
        )}
      </div>

      {customBuilderOpen && (
        <CustomWorkoutBuilder
          open
          userId={userId}
          userEquipment={userEquipment}
          canImport={canImportWorkouts}
          templates={workoutTemplates}
          initialDraft={customBuilderDraft}
          onClose={() => setCustomBuilderOpen(false)}
          onStarted={(clientId) => {
            setCustomBuilderOpen(false);
            openWorkout(clientId);
          }}
        />
      )}
    </div>
  );
}
