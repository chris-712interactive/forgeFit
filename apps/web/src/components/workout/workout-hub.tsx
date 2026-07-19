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
  saveLocalTemplate,
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
  effectiveScheduledDateIso,
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
import Link from "next/link";
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
import {
  FEATURE_SYNC_TEMPORARILY_LIMITED,
  FEATURE_TEMPORARILY_UNAVAILABLE,
} from "@/lib/ui/member-errors";
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
import { MaxTestLauncher } from "./max-test-launcher";
import { AssignedCustomWorkoutCard } from "./assigned-custom-workout-card";
import {
  GRAVITY_WEEK1_TEMPLATE_NAMES,
  GRAVITY_WEEK1_TEMPLATES,
} from "@/lib/workouts/packs/gravity-week1";
import {
  completedCustomSessionForAssignment,
  dateHasProgramSession,
  inProgressCustomSessionForAssignment,
  suppressedProgramDayIndexes,
  type WorkoutDayAssignmentView,
} from "@/lib/workouts/day-assignments";
import { CUSTOM_DAY_INDEX } from "@/lib/workouts/session-source";
import { browserTimeZone, addDaysIso, browserTodayIsoDate } from "@/lib/datetime/local-date";
import { getWeekBounds } from "@/lib/home/weekly-stats";
import { planScheduleReferenceDate } from "@/lib/workouts/schedule-dates";

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
      groupId?: string;
    }>;
    warmup?: import("@forgefit/program-engine").WarmupBlock | null;
    intervalProtocol?: import("@forgefit/offline-sync").IntervalProtocol | null;
  }>;
  dayAssignments?: WorkoutDayAssignmentView[];
  dayAssignmentsTableReady?: boolean;
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
  dayAssignments: serverDayAssignments = [],
  dayAssignmentsTableReady = true,
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
  const [maxTestOpen, setMaxTestOpen] = useState(false);
  const [customBuilderDraft, setCustomBuilderDraft] =
    useState<CustomWorkoutDraft | null>(null);
  const [installingGravity, setInstallingGravity] = useState(false);
  const [gravityInstallMessage, setGravityInstallMessage] = useState<
    string | null
  >(null);
  const [dayAssignments, setDayAssignments] = useState<WorkoutDayAssignmentView[]>(
    serverDayAssignments
  );
  const [startingAssignmentId, setStartingAssignmentId] = useState<string | null>(
    null
  );
  const [resumeSession, setResumeSession] = useState<{
    clientId: string;
    sessionName: string;
  } | null>(null);
  const offline = useOfflineStatus();
  const unit = useUnitPreference();

  useEffect(() => {
    setDayAssignments(serverDayAssignments);
  }, [serverDayAssignments]);

  const templateById = useMemo(() => {
    return new Map(workoutTemplates.map((row) => [row.id, row]));
  }, [workoutTemplates]);

  const gravityInstalledCount = useMemo(() => {
    const names = new Set(workoutTemplates.map((row) => row.name));
    return GRAVITY_WEEK1_TEMPLATE_NAMES.filter((name) => names.has(name)).length;
  }, [workoutTemplates]);

  const installGravityWeek1 = useCallback(async () => {
    if (!canCustomWorkouts || installingGravity) return;
    setInstallingGravity(true);
    setGravityInstallMessage(null);
    try {
      let created = 0;
      let skipped = 0;
      const existing = new Set(workoutTemplates.map((row) => row.name));

      for (const template of GRAVITY_WEEK1_TEMPLATES) {
        if (existing.has(template.name)) {
          skipped += 1;
          continue;
        }

        const response = await fetch("/api/workout-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: template.name,
            exercises: template.exercises,
            intervalProtocol: template.intervalProtocol,
          }),
        });
        const body = (await response.json()) as {
          error?: string;
          template?: { id: string };
        };
        if (!response.ok) {
          throw new Error(body.error ?? "Could not install Gravity templates.");
        }

        await saveLocalTemplate({
          userId,
          id: body.template?.id,
          name: template.name,
          exercises: template.exercises,
          intervalProtocol: template.intervalProtocol,
        });
        created += 1;
      }

      if (created === 0 && skipped > 0) {
        setGravityInstallMessage("Gravity Week 1 templates already installed.");
      } else {
        setGravityInstallMessage(
          `Installed ${created} Gravity Week 1 template${created === 1 ? "" : "s"}${
            skipped ? ` (${skipped} already present)` : ""
          }.`
        );
      }
      router.refresh();
    } catch (err) {
      setGravityInstallMessage(
        err instanceof Error ? err.message : "Install failed."
      );
    } finally {
      setInstallingGravity(false);
    }
  }, [
    canCustomWorkouts,
    installingGravity,
    router,
    userId,
    workoutTemplates,
  ]);

  const allSessions = useMemo(
    () => mergeSessionRecords(localSessions, serverSessions),
    [localSessions, serverSessions]
  );

  const inProgressCustomByAssignmentId = useMemo(() => {
    const map = new Map<string, string>();
    const timeZone = browserTimeZone() ?? "UTC";
    for (const assignment of dayAssignments) {
      const session = inProgressCustomSessionForAssignment(
        assignment,
        allSessions,
        timeZone
      );
      if (session) {
        map.set(assignment.id, session.clientId);
      }
    }
    return map;
  }, [allSessions, dayAssignments]);

  const completedCustomByAssignmentId = useMemo(() => {
    const map = new Map<
      string,
      {
        clientId: string;
        completedSets: number;
        totalSets: number;
        completedAt: string | null;
      }
    >();
    const timeZone = browserTimeZone() ?? "UTC";
    for (const assignment of dayAssignments) {
      const session = completedCustomSessionForAssignment(
        assignment,
        allSessions,
        timeZone
      );
      if (!session) continue;
      map.set(assignment.id, {
        clientId: session.clientId,
        completedSets: session.sets.filter((set) => set.completed).length,
        totalSets: session.sets.length,
        completedAt: session.completedAt,
      });
    }
    return map;
  }, [allSessions, dayAssignments]);

  const sortedPlanSessions = useMemo(() => {
    if (!plan) return [];
    return [...plan.week].sort((a, b) =>
      compareSessionsByEffectiveDate(a, b, plan, scheduleOverrides)
    );
  }, [plan, scheduleOverrides]);

  const suppressedDayIndexes = useMemo(() => {
    if (!plan) return new Set<number>();
    return suppressedProgramDayIndexes(plan, scheduleOverrides, dayAssignments);
  }, [plan, scheduleOverrides, dayAssignments]);

  const visiblePlanSessions = useMemo(
    () =>
      sortedPlanSessions.filter(
        (session) => !suppressedDayIndexes.has(session.dayIndex)
      ),
    [sortedPlanSessions, suppressedDayIndexes]
  );

  const weekAssignmentWindow = useMemo(() => {
    if (plan) {
      const ref = planScheduleReferenceDate(plan);
      return getWeekBounds(ref);
    }
    const today = browserTodayIsoDate();
    return { startIso: today, endIso: addDaysIso(today, 6) };
  }, [plan]);

  const weekDayAssignments = useMemo(() => {
    return dayAssignments
      .filter(
        (row) =>
          row.scheduledDateIso >= weekAssignmentWindow.startIso &&
          row.scheduledDateIso <= weekAssignmentWindow.endIso
      )
      .sort((a, b) => a.scheduledDateIso.localeCompare(b.scheduledDateIso));
  }, [dayAssignments, weekAssignmentWindow]);

  type HubWeekItem =
    | { kind: "program"; sortDate: string; session: WorkoutSession }
    | {
        kind: "custom";
        sortDate: string;
        assignment: WorkoutDayAssignmentView;
      };

  const hubWeekItems = useMemo(() => {
    const items: HubWeekItem[] = [];

    if (plan) {
      for (const session of visiblePlanSessions) {
        items.push({
          kind: "program",
          sortDate: effectiveScheduledDateIso(
            session.dayIndex,
            plan,
            scheduleOverrides
          ),
          session,
        });
      }
    }

    for (const assignment of weekDayAssignments) {
      items.push({
        kind: "custom",
        sortDate: assignment.scheduledDateIso,
        assignment,
      });
    }

    return items.sort((a, b) => {
      const byDate = a.sortDate.localeCompare(b.sortDate);
      if (byDate !== 0) return byDate;
      if (a.kind === b.kind) return 0;
      return a.kind === "program" ? -1 : 1;
    });
  }, [
    plan,
    visiblePlanSessions,
    scheduleOverrides,
    weekDayAssignments,
  ]);

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

  useEffect(() => {
    if (activeClientId || reviewClientId) {
      setResumeSession(null);
      return;
    }

    const storedClientId = sessionStorage.getItem(OFFLINE_ACTIVE_KEY);
    if (!storedClientId) {
      setResumeSession(null);
      return;
    }

    void getSession(storedClientId).then((session) => {
      if (session?.status === "in_progress") {
        setResumeSession({
          clientId: storedClientId,
          sessionName: session.sessionName,
        });
      } else {
        persistActiveWorkout(null);
        setResumeSession(null);
      }
    });
  }, [activeClientId, reviewClientId, sessionsReady]);

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

  const resolveAssignConflict = useCallback(
    (scheduledDateIso: string) => {
      const existingCustoms = dayAssignments.filter(
        (row) => row.scheduledDateIso === scheduledDateIso
      );
      const hasProgram =
        plan != null &&
        dateHasProgramSession(plan, scheduleOverrides, scheduledDateIso);

      if (!hasProgram && existingCustoms.length === 0) {
        return { hasConflict: false, label: "" };
      }

      const parts: string[] = [];
      if (hasProgram) parts.push("a program workout");
      if (existingCustoms.length === 1) {
        parts.push(`“${existingCustoms[0]!.templateName}”`);
      } else if (existingCustoms.length > 1) {
        parts.push(`${existingCustoms.length} custom workouts`);
      }

      return {
        hasConflict: true,
        label: `This day already has ${parts.join(" and ")}.`,
      };
    },
    [dayAssignments, plan, scheduleOverrides]
  );

  const refreshDayAssignments = useCallback(async () => {
    try {
      const response = await fetch("/api/workout-day-assignments");
      const body = (await response.json()) as {
        assignments?: Array<{
          id: string;
          templateId: string;
          scheduledDateIso: string;
          replacesProgram: boolean;
          templateName?: string | null;
        }>;
      };
      if (!response.ok) return;
      setDayAssignments(
        (body.assignments ?? []).map((row) => ({
          id: row.id,
          templateId: row.templateId,
          scheduledDateIso: row.scheduledDateIso,
          replacesProgram: row.replacesProgram,
          templateName: row.templateName ?? "Custom workout",
        }))
      );
    } catch {
      // Keep current list.
    }
    router.refresh();
  }, [router]);

  const handleStartAssigned = useCallback(
    async (assignment: WorkoutDayAssignmentView) => {
      const existingClientId = inProgressCustomByAssignmentId.get(assignment.id);
      if (existingClientId) {
        openWorkout(existingClientId);
        return;
      }

      const template = templateById.get(assignment.templateId);
      if (!template) {
        window.alert("Template missing — open Custom workout and reload it.");
        return;
      }
      setStartingAssignmentId(assignment.id);
      try {
        const clientId = await startWorkoutSession({
          userId,
          sessionName: template.name,
          dayIndex: CUSTOM_DAY_INDEX,
          sessionSource: "custom",
          templateId: template.id,
          exercises: template.exercises,
          warmupBlock: template.warmup ?? undefined,
          intervalProtocol: template.intervalProtocol ?? undefined,
        });
        openWorkout(clientId);
      } catch (err) {
        window.alert(
          err instanceof Error ? err.message : "Could not start workout."
        );
      } finally {
        setStartingAssignmentId(null);
      }
    },
    [inProgressCustomByAssignmentId, openWorkout, templateById, userId]
  );

  const handleRemoveAssignment = useCallback(
    async (assignmentId: string) => {
      const confirmed = window.confirm(
        "Remove this custom workout from the calendar?"
      );
      if (!confirmed) return;
      try {
        const response = await fetch(
          `/api/workout-day-assignments?id=${encodeURIComponent(assignmentId)}`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Could not remove assignment.");
        }
        setDayAssignments((current) =>
          current.filter((row) => row.id !== assignmentId)
        );
        router.refresh();
      } catch (err) {
        window.alert(
          err instanceof Error ? err.message : "Could not remove assignment."
        );
      }
    },
    [router]
  );

  const openReview = useCallback((clientId: string) => {
    setActiveClientId(null);
    setReviewClientId(clientId);
    replaceWorkoutUrl("review", clientId);
  }, []);

  const closeToHub = useCallback(() => {
    const resumableClientId = activeClientId;
    setActiveClientId(null);
    setReviewClientId(null);
    setFinishRankDelta(null);
    if (resumableClientId) {
      persistActiveWorkout(resumableClientId);
    }
    replaceWorkoutUrl("hub", null);
    void refreshSessions();
  }, [activeClientId, refreshSessions]);

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
      persistActiveWorkout(null);
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
          citationRuleIds: session.citationRuleIds,
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
          persistActiveWorkout(null);
          setActiveClientId(null);
          replaceWorkoutUrl("hub", null);
        } else if (sessionStorage.getItem(OFFLINE_ACTIVE_KEY) === clientId) {
          persistActiveWorkout(null);
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
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
            <Link href="/exercises" className="text-forge-steel hover:text-forge-ember">
              Exercise library →
            </Link>
          </div>
          {offline && (
            <p className="mt-2 text-sm text-forge-steel">
              Offline mode — progress is saved on this device and syncs when
              you&apos;re back online.
            </p>
          )}
        </header>

        <PwaInstallPrompt />

        {resumeSession && (
          <section className="rounded-2xl border border-forge-ember/40 bg-forge-ember/10 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-ember">
              Workout in progress
            </p>
            <p className="mt-1 font-display font-semibold text-forge-text">
              {resumeSession.sessionName}
            </p>
            <p className="mt-1 text-sm text-forge-muted">
              Your timer position is saved — pick up where you left off.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openWorkout(resumeSession.clientId)}
                className="min-h-[44px] flex-1 rounded-xl bg-forge-ember px-4 py-2 text-sm font-semibold text-white"
              >
                Continue workout
              </button>
              <button
                type="button"
                onClick={() => {
                  persistActiveWorkout(null);
                  setResumeSession(null);
                }}
                className="min-h-[44px] rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted"
              >
                Dismiss
              </button>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-forge-gold/30 bg-forge-gold/5 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
            Training maxes
          </p>
          <p className="mt-1 text-sm text-forge-muted">
            Attempt a true one-rep max for any weighted exercise and save it to
            your profile for smarter load prescriptions.
          </p>
          <button
            type="button"
            onClick={() => setMaxTestOpen(true)}
            className="mt-3 min-h-[44px] w-full rounded-xl border border-forge-gold/40 bg-forge-surface px-4 py-2 text-sm font-semibold text-forge-gold hover:border-forge-gold"
          >
            Test 1RM
          </button>
        </section>

        <CustomWorkoutCard
          canUseCustomWorkouts={canCustomWorkouts}
          templateCount={workoutTemplates.length}
          onOpenBuilder={() => {
            setCustomBuilderDraft(null);
            setCustomBuilderOpen(true);
          }}
        />

        {canCustomWorkouts && (
          <section className="rounded-2xl border border-forge-ember/30 bg-forge-ember/5 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-ember">
              Gravity Transformations
            </p>
            <p className="mt-1 text-sm text-forge-muted">
              Install Week 1 Full Body, Cardio Acceleration, and Metabolic
              Conditioning with matching interval timers.
            </p>
            <button
              type="button"
              disabled={installingGravity || gravityInstalledCount === 3}
              onClick={() => void installGravityWeek1()}
              className="mt-3 min-h-[44px] w-full rounded-xl bg-forge-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {installingGravity
                ? "Installing…"
                : gravityInstalledCount === 3
                  ? "Week 1 installed"
                  : "Install Gravity Week 1"}
            </button>
            {gravityInstallMessage && (
              <p className="mt-2 text-sm text-forge-success" role="status">
                {gravityInstallMessage}
              </p>
            )}
          </section>
        )}

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
                {FEATURE_TEMPORARILY_UNAVAILABLE}
              </p>
            )}

            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
              This week
            </h2>
            {!dayAssignmentsTableReady && canCustomWorkouts && (
              <p className="rounded-xl border border-forge-steel/30 bg-forge-surface-raised px-4 py-2 text-sm text-forge-steel">
                {FEATURE_SYNC_TEMPORARILY_LIMITED}
              </p>
            )}
            {hubWeekItems.map((item) =>
              item.kind === "program" ? (
                <WeekPlanCard
                  key={`program-${item.session.dayIndex}-${item.session.name}`}
                  plan={plan}
                  session={item.session}
                  dayStatus={dayStatusMap.get(item.session.dayIndex)}
                  scheduleOverrides={scheduleOverrides}
                  starting={startingDay === item.session.dayIndex}
                  discarding={
                    discardingClientId ===
                    dayStatusMap.get(item.session.dayIndex)?.inProgress
                      ?.clientId
                  }
                  onStart={() => void handleStart(item.session.dayIndex)}
                  onContinue={openWorkout}
                  onDiscard={(clientId) => void handleDiscard(clientId)}
                  onViewResults={openReview}
                  onAdjustSchedule={
                    scheduleOverridesTableReady
                      ? () => setAdjustingSession(item.session)
                      : undefined
                  }
                />
              ) : (
                <AssignedCustomWorkoutCard
                  key={`custom-${item.assignment.id}`}
                  assignmentId={item.assignment.id}
                  templateName={item.assignment.templateName}
                  scheduledDateIso={item.assignment.scheduledDateIso}
                  replacesProgram={item.assignment.replacesProgram}
                  exerciseCount={
                    templateById.get(item.assignment.templateId)?.exercises
                      .length ?? 0
                  }
                  starting={startingAssignmentId === item.assignment.id}
                  inProgressClientId={inProgressCustomByAssignmentId.get(
                    item.assignment.id
                  )}
                  completedClientId={
                    completedCustomByAssignmentId.get(item.assignment.id)
                      ?.clientId
                  }
                  completedSets={
                    completedCustomByAssignmentId.get(item.assignment.id)
                      ?.completedSets
                  }
                  completedTotalSets={
                    completedCustomByAssignmentId.get(item.assignment.id)
                      ?.totalSets
                  }
                  completedAtIso={
                    completedCustomByAssignmentId.get(item.assignment.id)
                      ?.completedAt
                  }
                  onStart={() => void handleStartAssigned(item.assignment)}
                  onContinue={openWorkout}
                  onViewResults={openReview}
                  onRemove={() => void handleRemoveAssignment(item.assignment.id)}
                />
              )
            )}
            {hubWeekItems.length === 0 && (
              <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-forge-muted">
                No workouts scheduled this week yet.
              </p>
            )}

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
                  : FEATURE_TEMPORARILY_UNAVAILABLE}
              </p>
            </div>

            {weekDayAssignments.length > 0 && (
              <>
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
                  Assigned custom workouts
                </h2>
                {weekDayAssignments.map((assignment) => (
                  <AssignedCustomWorkoutCard
                    key={assignment.id}
                    assignmentId={assignment.id}
                    templateName={assignment.templateName}
                    scheduledDateIso={assignment.scheduledDateIso}
                    replacesProgram={assignment.replacesProgram}
                    exerciseCount={
                      templateById.get(assignment.templateId)?.exercises
                        .length ?? 0
                    }
                    starting={startingAssignmentId === assignment.id}
                    inProgressClientId={inProgressCustomByAssignmentId.get(
                      assignment.id
                    )}
                    completedClientId={
                      completedCustomByAssignmentId.get(assignment.id)?.clientId
                    }
                    completedSets={
                      completedCustomByAssignmentId.get(assignment.id)
                        ?.completedSets
                    }
                    completedTotalSets={
                      completedCustomByAssignmentId.get(assignment.id)?.totalSets
                    }
                    completedAtIso={
                      completedCustomByAssignmentId.get(assignment.id)
                        ?.completedAt
                    }
                    onStart={() => void handleStartAssigned(assignment)}
                    onContinue={openWorkout}
                    onViewResults={openReview}
                    onRemove={() => void handleRemoveAssignment(assignment.id)}
                  />
                ))}
              </>
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
        )}
      </div>

      {maxTestOpen && (
        <MaxTestLauncher
          open
          userId={userId}
          userEquipment={userEquipment}
          declaredE1rmKg={declaredE1rmKg}
          onClose={() => setMaxTestOpen(false)}
          onStarted={(clientId) => {
            setMaxTestOpen(false);
            openWorkout(clientId);
          }}
        />
      )}

      {customBuilderOpen && (
        <CustomWorkoutBuilder
          open
          userId={userId}
          userEquipment={userEquipment}
          canImport={canImportWorkouts}
          templates={workoutTemplates}
          initialDraft={customBuilderDraft}
          resolveAssignConflict={resolveAssignConflict}
          onAssigned={() => {
            void refreshDayAssignments();
          }}
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
