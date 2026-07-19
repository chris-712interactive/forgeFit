"use client";

import {
  isDurationHoldExercise,
  isTimedCardioExercise,
  isTimedExercise,
  exerciseTracksWeight,
  resolveTimedPrescription,
  timedSetFieldsFromElapsed,
  timedTargetSeconds,
  type HoldExperience,
} from "@forgefit/exercise-db";
import {
  pickPrCelebrationBody,
  pickPrCelebrationHeadline,
  pickPreWorkoutHype,
  type CoachingGoal,
} from "@forgefit/coaching";
import type { ExperienceLevel } from "@/lib/types/profile";
import { publishWorkoutPrWin } from "@/app/actions/gamification";
import { saveUserOneRepMax } from "@/app/actions/one-rep-maxes";
import { readActionError } from "@/lib/auth/action-result";
import { PreWorkoutHypeBanner } from "@/components/coaching/pre-workout-hype-banner";
import { CommunityRankStrip } from "@/components/coaching/community-rank-strip";
import { WorkoutReadinessStrip } from "@/components/workout/workout-readiness-strip";
import type { WorkoutReadinessContext } from "@/lib/workouts/device-metrics-types";
import { PrCelebrationModal } from "@/components/coaching/pr-celebration-modal";
import { MaxTestResultModal } from "@/components/workout/max-test-result-modal";
import {
  detectSetPr,
  type DetectedWorkoutPr,
} from "@/lib/coaching/detect-pr";
import { isMaxTestSession } from "@/lib/progression/max-test";
import { resolveOneRepMaxLabel } from "@/lib/progression/one-rep-max-lifts";
import type { WorkoutCoachingFeatures } from "@/lib/coaching/types";
import {
  buildWorkoutSteps,
  canAdvanceFromStep,
  initialStepIndex,
  parseConditioningReps,
  stepLabel,
  type WorkoutStep,
} from "@/lib/workouts/workout-steps";
import {
  completeWorkoutSession,
  appendExerciseSet,
  getSession,
  getSetsForSession,
  updateSet,
  updateWorkoutRecovery,
  updateWorkoutWarmup,
  updateWorkoutConditioning,
  type LocalExerciseSet,
  type LocalWorkoutSession,
} from "@forgefit/offline-sync";
import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  buildEasySetSuggestion,
  type EasySetSuggestion,
} from "@/lib/workouts/in-session-progression";
import { collectSessionEquipment } from "@/lib/workouts/session-equipment";
import {
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import { EasySetSuggestionBanner } from "./easy-set-suggestion";
import { WorkoutEquipmentOverviewCard } from "./workout-equipment-overview-card";
import { useOfflineStatus } from "@/hooks/use-online-status";
import { useScreenWakeLock } from "@/hooks/use-screen-wake-lock";
import {
  clearPersistedActiveTimer,
  loadPersistedActiveTimer,
  savePersistedActiveTimer,
  toCountdownRestore,
  type PersistedActiveTimer,
} from "@/lib/workouts/active-timer-persistence";
import type { CountdownCompleteMeta, CountdownPersistState, CountdownRestoreState } from "@/lib/workouts/deadline-timer";
import { feedbackIntervalPhase, feedbackIntervalStartFromGesture, feedbackTimerComplete } from "@/lib/workouts/timer-feedback";
import {
  advanceIntervalState,
  initialIntervalState,
  resolveIntervalBlocks,
  type IntervalRunState,
} from "@/lib/workouts/interval-protocol";
import { markFirstWorkoutComplete } from "@/components/pwa/install-prompt";
import { appPagePadding } from "@/components/layout/page-layout";
import {
  completedSetsOnOriginalExercise,
  setsForExerciseSlot,
} from "@/lib/workouts/exercise-swap";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HoldTimer } from "./hold-timer";
import { IntervalTimer } from "./interval-timer";
import { RecoveryBlockCard } from "./recovery-block-card";
import { ConditioningBlockCard } from "./conditioning-block-card";
import { WarmupBlockCard } from "./warmup-block-card";
import { RestTimer } from "./rest-timer";
import { SetRow } from "./set-row";
import { WorkoutStepHeader } from "./workout-step-header";
import { WorkoutMusicPicker } from "./workout-music-picker";
import { WorkoutMusicTransport } from "./workout-music-transport";
import { ExerciseSwapSheet } from "./exercise-swap-sheet";
import { useWorkoutSyncContext } from "./sync-manager";

interface ActiveWorkoutProps {
  clientId: string;
  userEquipment?: string[];
  experienceLevel?: ExperienceLevel;
  coaching?: WorkoutCoachingFeatures | null;
  readiness?: WorkoutReadinessContext | null;
  spotifyConnected?: boolean;
  onBack?: () => void;
  onFinished?: (clientId: string) => void | Promise<void>;
}

export function ActiveWorkout({
  clientId,
  userEquipment = ["bodyweight_only"],
  experienceLevel = "beginner",
  coaching = null,
  readiness = null,
  spotifyConnected = false,
  onBack,
  onFinished,
}: ActiveWorkoutProps) {
  const sync = useWorkoutSyncContext();
  const [session, setSession] = useState<LocalWorkoutSession | null>(null);
  const [sets, setSets] = useState<LocalExerciseSet[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [timedTimer, setTimedTimer] = useState<{
    setClientId: string;
    exerciseId: string;
    seconds: number;
    label: string;
  } | null>(null);
  const [warmupTimer, setWarmupTimer] = useState<{
    seconds: number;
    label: string;
  } | null>(null);
  const [recoveryTimer, setRecoveryTimer] = useState<{
    seconds: number;
    label: string;
  } | null>(null);
  const [restTimerKey, setRestTimerKey] = useState("rest");
  const [restTimerRestore, setRestTimerRestore] =
    useState<CountdownRestoreState | null>(null);
  const [holdTimerKey, setHoldTimerKey] = useState("hold");
  const [holdTimerRestore, setHoldTimerRestore] =
    useState<CountdownRestoreState | null>(null);
  const [intervalRun, setIntervalRun] = useState<IntervalRunState | null>(null);
  const [intervalTimerKey, setIntervalTimerKey] = useState("interval");
  const [intervalTimerRestore, setIntervalTimerRestore] =
    useState<CountdownRestoreState | null>(null);
  const [intervalTimerHidden, setIntervalTimerHidden] = useState(false);
  const [intervalCueFromGesture, setIntervalCueFromGesture] = useState(false);
  const [restAwayNotice, setRestAwayNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [celebrationPr, setCelebrationPr] = useState<DetectedWorkoutPr | null>(
    null
  );
  const [prSavePending, setPrSavePending] = useState(false);
  const [prSaveMessage, setPrSaveMessage] = useState<string | null>(null);
  const [maxTestResult, setMaxTestResult] = useState<{
    exerciseId: string;
    exerciseLabel: string;
    weightKg: number;
    saved: boolean;
  } | null>(null);
  const sessionBestE1rmRef = useRef<Map<string, number>>(new Map());
  const maxTestMode = session ? isMaxTestSession(session.sessionName) : false;
  const offline = useOfflineStatus();
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);
  const [easySuggestion, setEasySuggestion] = useState<{
    setClientId: string;
    suggestion: EasySetSuggestion;
  } | null>(null);
  const [musicStripDismissed, setMusicStripDismissed] = useState(false);
  const [swapSheetOpen, setSwapSheetOpen] = useState(false);
  const [swapConfirmation, setSwapConfirmation] = useState<string | null>(
    null
  );
  const restoredTimerRef = useRef(false);

  const workoutTimerActive =
    (restSeconds != null && restSeconds > 0) ||
    warmupTimer != null ||
    recoveryTimer != null ||
    timedTimer != null ||
    intervalRun != null;

  useScreenWakeLock(workoutTimerActive);

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
    if (sessionRow) {
      const steps = buildWorkoutSteps(sessionRow);
      setCurrentStepIndex(initialStepIndex(steps, sessionRow, setRows));
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || !session || restoredTimerRef.current) return;
    restoredTimerRef.current = true;

    const persisted = loadPersistedActiveTimer(clientId);
    if (!persisted) return;

    const now = Date.now();
    if (!persisted.paused && persisted.endsAtMs <= now) {
      clearPersistedActiveTimer(clientId);
      if (persisted.kind === "rest") {
        feedbackTimerComplete({ vibrate: true });
        setRestAwayNotice(true);
        window.setTimeout(() => setRestAwayNotice(false), 4000);
        return;
      }
      if (persisted.kind === "warmup" && session.warmupBlock) {
        void updateWorkoutWarmup(clientId, {
          status: "completed",
          durationMs: session.warmupBlock.durationMinutes * 60_000,
        }).then((updated) => {
          if (updated) setSession(updated);
        });
        return;
      }
      if (persisted.kind === "recovery" && session.recoveryBlock) {
        void updateWorkoutRecovery(clientId, {
          status: "completed",
          durationMs: session.recoveryBlock.durationMinutes * 60_000,
        }).then((updated) => {
          if (updated) setSession(updated);
        });
        return;
      }
      if (
        persisted.kind === "hold" &&
        persisted.setClientId &&
        persisted.exerciseId
      ) {
        void handleSetUpdate(persisted.setClientId, {
          ...timedSetFieldsFromElapsed(
            persisted.exerciseId,
            persisted.totalSeconds
          ),
          completed: true,
        });
      }
      if (persisted.kind === "interval") {
        feedbackIntervalPhase("complete", { playSound: false, vibrate: true });
      }
      return;
    }

    const restore = toCountdownRestore(persisted);
    switch (persisted.kind) {
      case "rest":
        setRestTimerKey(`rest-${persisted.endsAtMs}`);
        setRestTimerRestore(restore);
        setRestSeconds(persisted.totalSeconds);
        break;
      case "hold":
        if (persisted.setClientId && persisted.exerciseId && persisted.label) {
          setHoldTimerKey(`hold-${persisted.endsAtMs}`);
          setHoldTimerRestore(restore);
          setTimedTimer({
            setClientId: persisted.setClientId,
            exerciseId: persisted.exerciseId,
            seconds: persisted.totalSeconds,
            label: persisted.label,
          });
        }
        break;
      case "warmup":
        setHoldTimerKey(`warmup-${persisted.endsAtMs}`);
        setHoldTimerRestore(restore);
        setWarmupTimer({
          seconds: persisted.totalSeconds,
          label: persisted.label ?? "Warm-up",
        });
        break;
      case "recovery":
        setHoldTimerKey(`recovery-${persisted.endsAtMs}`);
        setHoldTimerRestore(restore);
        setRecoveryTimer({
          seconds: persisted.totalSeconds,
          label: persisted.label ?? "Recovery",
        });
        break;
      case "interval":
        if (restoreIntervalFromPersisted(persisted)) {
          break;
        }
        clearPersistedActiveTimer(clientId);
        break;
    }
  }, [clientId, loading, session]);

  useEffect(() => {
    if (!swapConfirmation) return;
    const timer = window.setTimeout(() => setSwapConfirmation(null), 2200);
    return () => window.clearTimeout(timer);
  }, [swapConfirmation]);

  const steps = useMemo(
    () => (session ? buildWorkoutSteps(session) : []),
    [session]
  );

  const intervalBlocks = useMemo(() => {
    if (!session?.intervalProtocol) return [];
    return resolveIntervalBlocks(session.intervalProtocol, session.exercises);
  }, [session]);

  const currentStep = steps[currentStepIndex];

  const preWorkoutHype = useMemo(() => {
    if (!coaching?.aiMotivationEnabled || !session?.sessionName) {
      return null;
    }

    return pickPreWorkoutHype({
      goal: coaching.goal as CoachingGoal,
      experience: coaching.experienceLevel,
      sessionName: session.sessionName,
      displayName: coaching.displayName,
      whyStarted: coaching.whyStarted,
      isDeloadWeek: coaching.isDeloadWeek,
      workoutsCompletedThisWeek: coaching.workoutsCompletedThisWeek,
      workoutsPlannedThisWeek: coaching.workoutsPlannedThisWeek,
    });
  }, [coaching, session?.sessionName]);

  const setsByExercise = useMemo(() => {
    const map = new Map<string, LocalExerciseSet[]>();
    for (const set of sets) {
      const group = map.get(set.exerciseId) ?? [];
      group.push(set);
      map.set(set.exerciseId, group);
    }
    for (const group of map.values()) {
      group.sort((a, b) => a.setNumber - b.setNumber);
    }
    return map;
  }, [sets]);

  const sessionEquipment = useMemo(
    () => (session ? collectSessionEquipment(session) : []),
    [session]
  );

  const completedCount = sets.filter((s) => s.completed).length;
  const totalCount = sets.length;

  const persistedIntervalResume = useMemo(() => {
    if (intervalRun) return false;
    const persisted = loadPersistedActiveTimer(clientId);
    return (
      persisted?.kind === "interval" &&
      persisted.intervalPhase != null &&
      persisted.intervalPhase !== "done"
    );
  }, [clientId, intervalRun]);

  function clearCountdownTimers() {
    setRestSeconds(null);
    setTimedTimer(null);
    setWarmupTimer(null);
    setRecoveryTimer(null);
    setRestTimerRestore(null);
    setHoldTimerRestore(null);
    const persisted = loadPersistedActiveTimer(clientId);
    if (persisted?.kind === "interval") return;
    clearPersistedActiveTimer(clientId);
  }

  function clearTimers() {
    clearCountdownTimers();
    setIntervalRun(null);
    setIntervalTimerRestore(null);
    setIntervalTimerHidden(false);
    setIntervalCueFromGesture(false);
    clearPersistedActiveTimer(clientId);
  }

  function restoreIntervalFromPersisted(persisted: PersistedActiveTimer) {
    if (
      !session?.intervalProtocol ||
      !persisted.intervalPhase ||
      persisted.intervalRoundIndex == null ||
      persisted.intervalBlockIndex == null ||
      persisted.intervalSeconds == null
    ) {
      return false;
    }

    const restore = toCountdownRestore(persisted);
    setIntervalTimerKey(`interval-${persisted.endsAtMs}`);
    setIntervalTimerRestore(restore);
    setIntervalRun({
      phase: persisted.intervalPhase as IntervalRunState["phase"],
      roundIndex: persisted.intervalRoundIndex,
      blockIndex: persisted.intervalBlockIndex,
      seconds: persisted.intervalSeconds,
    });
    setIntervalTimerHidden(false);
    setIntervalCueFromGesture(false);

    if (persisted.workoutStepIndex != null) {
      setCurrentStepIndex(
        Math.max(0, Math.min(persisted.workoutStepIndex, steps.length - 1))
      );
    } else {
      jumpToIntervalBlock(persisted.intervalBlockIndex);
    }
    return true;
  }

  function jumpToIntervalBlock(blockIndex: number) {
    if (!session?.intervalProtocol) return;
    const blocks = resolveIntervalBlocks(
      session.intervalProtocol,
      session.exercises
    );
    const exerciseIndex = blocks[blockIndex]?.exerciseIndexes[0];
    if (exerciseIndex == null) return;
    const stepIndex = steps.findIndex(
      (step) => step.kind === "exercise" && step.exerciseIndex === exerciseIndex
    );
    if (stepIndex >= 0) {
      setCurrentStepIndex(stepIndex);
    }
  }

  function startIntervalProtocol() {
    if (!session?.intervalProtocol) return;

    const persisted = loadPersistedActiveTimer(clientId);
    if (
      persisted?.kind === "interval" &&
      persisted.intervalPhase &&
      persisted.intervalPhase !== "done"
    ) {
      if (restoreIntervalFromPersisted(persisted)) {
        return;
      }
    }

    // Unlock + GO cue inside the tap stack (required for iOS / PWA audio).
    void feedbackIntervalStartFromGesture();
    clearTimers();
    const next = initialIntervalState(session.intervalProtocol);
    setIntervalCueFromGesture(true);
    setIntervalTimerKey(`interval-${Date.now()}`);
    setIntervalTimerRestore(null);
    setIntervalRun(next);
    setIntervalTimerHidden(false);
    jumpToIntervalBlock(next.blockIndex);
  }

  function advanceIntervalPhase() {
    if (!session?.intervalProtocol || !intervalRun) return;
    setIntervalCueFromGesture(false);
    const next = advanceIntervalState(
      session.intervalProtocol,
      intervalRun,
      intervalBlocks.length
    );
    if (next.phase === "done") {
      feedbackIntervalPhase("complete");
      clearPersistedActiveTimer(clientId);
      setIntervalRun(null);
      setIntervalTimerRestore(null);
      setIntervalTimerHidden(false);
      return;
    }
    setIntervalTimerKey(`interval-${Date.now()}`);
    setIntervalTimerRestore(null);
    setIntervalRun(next);
    setIntervalTimerHidden(false);
    if (next.blockIndex !== intervalRun.blockIndex || next.phase === "work") {
      jumpToIntervalBlock(next.blockIndex);
    }
  }

  function persistActiveTimer(
    kind: PersistedActiveTimer["kind"],
    state: CountdownPersistState | null,
    extras: Partial<PersistedActiveTimer> = {}
  ) {
    if (!state) {
      clearPersistedActiveTimer(clientId);
      return;
    }
    savePersistedActiveTimer({
      sessionClientId: clientId,
      kind,
      ...state,
      ...extras,
    });
  }

  function handleRestComplete(meta?: CountdownCompleteMeta) {
    if (meta?.resumedFromBackground) {
      feedbackTimerComplete({ vibrate: true });
      setRestAwayNotice(true);
      window.setTimeout(() => setRestAwayNotice(false), 4000);
    }
    clearPersistedActiveTimer(clientId);
    setRestSeconds(null);
  }

  function startRestTimer(seconds: number) {
    setRestTimerKey(`rest-${Date.now()}`);
    setRestTimerRestore(null);
    setRestSeconds(seconds);
  }

  function refreshEasySuggestion(
    setRow: LocalExerciseSet,
    patch: Partial<Pick<LocalExerciseSet, "rir">>
  ) {
    if (!session) return;

    const nextRir = patch.rir ?? setRow.rir;
    if (nextRir == null || nextRir < 3) {
      setEasySuggestion((current) =>
        current?.setClientId === setRow.clientId ? null : current
      );
      return;
    }

    const exercise = session.exercises.find(
      (item) =>
        item.exerciseId === setRow.exerciseId ||
        item.plannedExerciseId === setRow.exerciseId
    );
    if (!exercise) return;

    const isTimed = isTimedExercise(exercise.exerciseId);
    const timedPrescription = isTimed
      ? resolveTimedPrescription(
          exercise.exerciseId,
          exercise.reps,
          experienceLevel as HoldExperience
        )
      : exercise.reps;
    const exerciseSets = setsForExerciseSlot(sets, exercise);

    const suggestion = buildEasySetSuggestion({
      set: { ...setRow, rir: nextRir },
      exerciseId: exercise.exerciseId,
      targetReps: timedPrescription,
      plannedSets: exercise.sets,
      plannedExtraSets: exercise.extraSets ?? 0,
      allSetsForExercise: exerciseSets,
      experienceLevel: coaching?.experienceLevel ?? experienceLevel,
      goal: coaching?.goal ?? "general_strength",
      unit,
      isDeloadWeek: coaching?.isDeloadWeek ?? false,
      estimatedE1rmKg: coaching?.priorBestE1rmKg[exercise.exerciseId],
    });

    if (suggestion) {
      setEasySuggestion({ setClientId: setRow.clientId, suggestion });
    } else {
      setEasySuggestion((current) =>
        current?.setClientId === setRow.clientId ? null : current
      );
    }
  }

  async function handleApplyEasyWeight() {
    const nextSetClientId = easySuggestion?.suggestion.nextSetClientId;
    const suggestedWeightKg = easySuggestion?.suggestion.suggestedWeightKg;
    if (!nextSetClientId || suggestedWeightKg == null) return;

    await handleSetUpdate(nextSetClientId, { weightKg: suggestedWeightKg });
    setEasySuggestion(null);
  }

  async function handleAddBonusSet(setRow: LocalExerciseSet) {
    if (!session) return;

    const created = await appendExerciseSet({
      sessionClientId: clientId,
      userId: session.userId,
      exerciseId: setRow.exerciseId,
      exerciseName: setRow.exerciseName,
      prefill: {
        weightKg: setRow.weightKg,
        reps: setRow.reps,
        durationMs: setRow.durationMs,
      },
    });

    if (created) {
      setSets((prev) =>
        [...prev, created].sort(
          (a, b) =>
            a.exerciseId.localeCompare(b.exerciseId) ||
            a.setNumber - b.setNumber
        )
      );
    }

    setEasySuggestion(null);
    void sync?.refreshPending();
    if (navigator.onLine) {
      void sync?.runSync();
    }
  }

  function goToStep(index: number) {
    clearCountdownTimers();
    setCurrentStepIndex(Math.max(0, Math.min(index, steps.length - 1)));
  }

  function goToNextStep() {
    goToStep(currentStepIndex + 1);
  }

  function goToPreviousStep() {
    goToStep(currentStepIndex - 1);
  }

  async function handleSetUpdate(
    setClientId: string,
    patch: Partial<
      Pick<
        LocalExerciseSet,
        | "reps"
        | "durationMs"
        | "weightKg"
        | "rir"
        | "completed"
      >
    >
  ) {
    const wasCompleted = sets.find((s) => s.clientId === setClientId)?.completed;
    const completing = patch.completed === true && !wasCompleted;
    const currentSet = sets.find((s) => s.clientId === setClientId);

    const updated = await updateSet(setClientId, {
      ...patch,
      completedAt:
        patch.completed === true ? new Date().toISOString() : undefined,
    });

    if (updated) {
      setSets((prev) =>
        prev.map((s) => (s.clientId === setClientId ? updated : s))
      );
    }

    if (currentSet && patch.rir !== undefined) {
      refreshEasySuggestion(currentSet, patch);
    }

    if (patch.completed === true) {
      setTimedTimer((current) =>
        current?.setClientId === setClientId ? null : current
      );
    }

    if (completing && session) {
      const setRow = sets.find((s) => s.clientId === setClientId);
      const exercise = session.exercises.find(
        (e) => e.exerciseId === setRow?.exerciseId
      );
      if (exercise?.restSeconds && !intervalRun && !maxTestMode) {
        startRestTimer(exercise.restSeconds);
      }

      if (
        maxTestMode &&
        setRow &&
        updated?.weightKg != null &&
        updated.weightKg > 0
      ) {
        const recordedWeightKg = updated.weightKg;
        void (async () => {
          const result = await saveUserOneRepMax(
            setRow.exerciseId,
            recordedWeightKg,
            "max_test"
          );
          const actionError = readActionError(result);
          setMaxTestResult({
            exerciseId: setRow.exerciseId,
            exerciseLabel: resolveOneRepMaxLabel(
              setRow.exerciseId,
              setRow.exerciseName
            ),
            weightKg: recordedWeightKg,
            saved: !actionError,
          });
        })();
      }

      if (
        coaching?.prCelebrationEnabled &&
        setRow &&
        updated?.weightKg != null &&
        updated.reps != null &&
        updated.weightKg > 0 &&
        updated.reps > 0 &&
        !maxTestMode
      ) {
        const historicalBest =
          coaching.priorBestE1rmKg[setRow.exerciseId] ?? 0;
        const sessionBest =
          sessionBestE1rmRef.current.get(setRow.exerciseId) ?? historicalBest;
        const detected = detectSetPr(
          setRow.exerciseId,
          setRow.exerciseName,
          updated.weightKg,
          updated.reps,
          updated.rir,
          sessionBest
        );

        if (detected) {
          sessionBestE1rmRef.current.set(setRow.exerciseId, detected.e1rmKg);
          setCelebrationPr(detected);

          if (coaching.gamificationOptIn) {
            const headline = pickPrCelebrationHeadline({
              exerciseLabel: detected.label,
              weightKg: detected.weightKg,
              reps: detected.reps,
              e1rmKg: detected.e1rmKg,
              goal: coaching.goal as CoachingGoal,
              displayName: coaching.displayName,
              unitSystem: unit,
            });
            const detail = pickPrCelebrationBody({
              exerciseLabel: detected.label,
              weightKg: detected.weightKg,
              reps: detected.reps,
              e1rmKg: detected.e1rmKg,
              goal: coaching.goal as CoachingGoal,
              displayName: coaching.displayName,
              unitSystem: unit,
            });
            void publishWorkoutPrWin({
              headline,
              detail,
              e1rmKg: detected.e1rmKg,
            });
          }
        }
      }
    }

    void sync?.refreshPending();
    if (navigator.onLine) {
      void sync?.runSync();
    }
  }

  function handleStartTimer(
    setClientId: string,
    exerciseId: string,
    seconds: number,
    label: string
  ) {
    setRestSeconds(null);
    setHoldTimerKey(`hold-${Date.now()}`);
    setHoldTimerRestore(null);
    setTimedTimer({ setClientId, exerciseId, seconds, label });
  }

  function logTimedSet(elapsedSeconds: number) {
    if (!timedTimer) return;
    const { setClientId, exerciseId } = timedTimer;
    setTimedTimer(null);
    void handleSetUpdate(setClientId, {
      ...timedSetFieldsFromElapsed(exerciseId, elapsedSeconds),
      completed: true,
    });
  }

  function handleTimedComplete() {
    if (!timedTimer) return;
    logTimedSet(timedTimer.seconds);
  }

  function handleTimedStop(elapsedSeconds: number) {
    logTimedSet(elapsedSeconds);
  }

  async function handleWarmupUpdate(
    status: "completed" | "skipped",
    durationMs?: number
  ) {
    const updated = await updateWorkoutWarmup(clientId, { status, durationMs });
    if (updated) {
      setSession(updated);
    }
    setWarmupTimer(null);
    void sync?.refreshPending();
    if (navigator.onLine) {
      void sync?.runSync();
    }
    if (status === "completed" || status === "skipped") {
      goToNextStep();
    }
  }

  function handleWarmupTimerComplete() {
    if (!warmupTimer || !session?.warmupBlock) return;
    void handleWarmupUpdate(
      "completed",
      session.warmupBlock.durationMinutes * 60_000
    );
  }

  function handleWarmupTimerStop(elapsedSeconds: number) {
    void handleWarmupUpdate("completed", elapsedSeconds * 1000);
  }

  async function handleRecoveryUpdate(
    status: "completed" | "skipped",
    durationMs?: number
  ) {
    const updated = await updateWorkoutRecovery(clientId, { status, durationMs });
    if (updated) {
      setSession(updated);
    }
    setRecoveryTimer(null);
    void sync?.refreshPending();
    if (navigator.onLine) {
      void sync?.runSync();
    }
    if (status === "completed" || status === "skipped") {
      goToNextStep();
    }
  }

  function handleRecoveryTimerComplete() {
    if (!recoveryTimer || !session?.recoveryBlock) return;
    void handleRecoveryUpdate(
      "completed",
      session.recoveryBlock.durationMinutes * 60_000
    );
  }

  function handleRecoveryTimerStop(elapsedSeconds: number) {
    void handleRecoveryUpdate("completed", elapsedSeconds * 1000);
  }

  async function handleConditioningUpdate(
    status: "completed" | "skipped",
    roundsCompleted?: number
  ) {
    const updated = await updateWorkoutConditioning(clientId, {
      status,
      roundsCompleted,
    });
    if (updated) {
      setSession(updated);
    }
    void sync?.refreshPending();
    if (navigator.onLine) {
      void sync?.runSync();
    }
    if (status === "completed" || status === "skipped") {
      goToNextStep();
    }
  }

  async function handleLogConditioningRound() {
    if (!session?.conditioningBlock || !session.userId) return;
    const block = session.conditioningBlock;
    const round = (session.conditioningRoundsCompleted ?? 0) + 1;
    const timestamp = new Date().toISOString();

    for (const movement of block.movements) {
      const created = await appendExerciseSet({
        sessionClientId: clientId,
        userId: session.userId,
        exerciseId: movement.exerciseId,
        exerciseName: movement.name,
        prefill: {
          reps: parseConditioningReps(movement.prescription),
        },
      });
      if (created) {
        await updateSet(created.clientId, {
          completed: true,
          completedAt: timestamp,
          reps: parseConditioningReps(movement.prescription),
        });
      }
    }

    const updated = await updateWorkoutConditioning(clientId, {
      roundsCompleted: round,
    });
    if (updated) {
      setSession(updated);
    }
    const setRows = await getSetsForSession(clientId);
    setSets(setRows);
    void sync?.refreshPending();
  }

  async function handleFinish() {
    if (finishing || cancelling) return;
    setFinishing(true);
    setFinishError(null);
    clearTimers();

    try {
      await completeWorkoutSession(clientId, "completed");
      markFirstWorkoutComplete();
      void sync?.refreshPending();
      if (navigator.onLine) {
        await sync?.runSync();
      }
      await onFinished?.(clientId);
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
    clearTimers();

    try {
      await completeWorkoutSession(clientId, "cancelled");
      void sync?.refreshPending();
      if (navigator.onLine) {
        await sync?.runSync();
      }
      goBack();
    } catch {
      setFinishError("Could not discard workout on this device. Try again.");
      setCancelling(false);
    }
  }

  async function handleExerciseSwapped(input: {
    exerciseId: string;
    exerciseName: string;
  }) {
    const [sessionRow, setRows] = await Promise.all([
      getSession(clientId),
      getSetsForSession(clientId),
    ]);
    setSession(sessionRow ?? null);
    setSets(setRows);
    setSwapConfirmation(`Swapped to ${input.exerciseName}`);
    void sync?.refreshPending();
    if (navigator.onLine) {
      void sync?.runSync();
    }
  }

  function renderExerciseStep(step: Extract<WorkoutStep, { kind: "exercise" }>) {
    if (!session) return null;
    const exercise = session.exercises[step.exerciseIndex];
    if (!exercise) return null;

    const exerciseSets = setsForExerciseSlot(sets, exercise);
    const isTimed = isTimedExercise(exercise.exerciseId);
    const isCardio = isTimedCardioExercise(exercise.exerciseId);
    const isHold = isDurationHoldExercise(exercise.exerciseId);
    const timedPrescription = isTimed
      ? resolveTimedPrescription(
          exercise.exerciseId,
          exercise.reps,
          experienceLevel as HoldExperience
        )
      : exercise.reps;
    const targetTimerSeconds = isTimed
      ? timedTargetSeconds(exercise.exerciseId, timedPrescription)
      : undefined;
    const timerLabel = isCardio ? "Cardio" : "Hold";
    const exerciseSetsComplete =
      exerciseSets.length > 0 && exerciseSets.every((set) => set.completed);
    const completedOnOriginal = completedSetsOnOriginalExercise(sets, exercise);
    const swappedFromName =
      exercise.plannedExerciseName &&
      exercise.plannedExerciseId !== exercise.exerciseId
        ? exercise.plannedExerciseName
        : null;

    return (
      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-3 sm:p-4">
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
              Exercise {step.exerciseIndex + 1} of {session.exercises.length}
            </p>
            <div className="flex flex-wrap gap-2">
              {!maxTestMode && (
                <button
                  type="button"
                  onClick={() => setSwapSheetOpen(true)}
                  className="inline-flex min-h-[36px] items-center rounded-lg border border-forge-gold/30 bg-forge-gold/10 px-3 text-xs font-semibold text-forge-gold transition-colors hover:border-forge-gold/50"
                >
                  Equipment busy?
                </button>
              )}
              <Link
                href={`/exercises/${exercise.exerciseId}?returnTo=${encodeURIComponent(`/workout?active=${clientId}&swapAt=${step.exerciseIndex}`)}`}
                className="inline-flex min-h-[36px] items-center rounded-lg border border-forge-steel/30 bg-forge-steel/5 px-3 text-xs font-semibold text-forge-steel transition-colors hover:border-forge-ember/40 hover:text-forge-ember"
              >
                View form →
              </Link>
            </div>
          </div>
          {swappedFromName && (
            <p className="mt-2 rounded-lg border border-forge-steel/30 bg-forge-steel/5 px-3 py-2 text-xs text-forge-steel">
              Swapped from {swappedFromName}
              {completedOnOriginal > 0
                ? ` · ${completedOnOriginal} set${completedOnOriginal === 1 ? "" : "s"} logged on original`
                : ""}
            </p>
          )}
          <p className="mt-2 text-sm text-forge-muted">
            {isCardio ? (
              <>Aim for {timedPrescription}</>
            ) : isHold ? (
              <>
                Aim for {exercise.sets + (exercise.extraSets ?? 0)} holds of{" "}
                {timedPrescription} · {exercise.restSeconds}s rest between sets
              </>
            ) : (
              <>
                Aim for {exercise.sets + (exercise.extraSets ?? 0)} sets of{" "}
                {exercise.reps} reps · {exercise.restSeconds}s rest between sets
              </>
            )}
            {exercise.extraSets ? (
              <span className="text-forge-gold">
                {" "}
                (+{exercise.extraSets} from progression)
              </span>
            ) : null}
          </p>
          {exercise.notes && (
            <p className="mt-2 rounded-lg border border-forge-gold/20 bg-forge-gold/5 px-3 py-2 text-xs text-forge-muted">
              {exercise.notes}
            </p>
          )}
          {exercise.progressionNote && (
            <p className="mt-2 rounded-lg border border-forge-steel/30 bg-forge-steel/5 px-3 py-2 text-xs text-forge-steel">
              {exercise.progressionNote}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {exerciseSets.map((set) => {
            const activeSuggestion =
              easySuggestion?.setClientId === set.clientId
                ? easySuggestion.suggestion
                : null;
            const displayWeight =
              activeSuggestion?.suggestedWeightKg != null
                ? kgToDisplayValue(activeSuggestion.suggestedWeightKg, unit)
                : undefined;
            const canAddBonusSet =
              exerciseSets.length <
              exercise.sets + (exercise.extraSets ?? 0) + 1;

            return (
              <div key={set.clientId}>
                <SetRow
                  set={set}
                  exerciseId={exercise.exerciseId}
                  targetReps={timedPrescription}
                  targetTimerSeconds={targetTimerSeconds}
                  isTimerActive={timedTimer?.setClientId === set.clientId}
                  maxTestMode={maxTestMode}
                  showProgressionHint={Boolean(
                    exercise.progressionNote &&
                      !set.completed &&
                      (isTimed
                        ? set.durationMs != null || set.reps != null
                        : exerciseTracksWeight(exercise.exerciseId)
                          ? set.weightKg != null || set.reps != null
                          : set.reps != null)
                  )}
                  onStartTimer={
                    isTimed && targetTimerSeconds
                      ? (setClientId) =>
                          handleStartTimer(
                            setClientId,
                            exercise.exerciseId,
                            targetTimerSeconds,
                            timerLabel
                          )
                      : undefined
                  }
                  onUpdate={handleSetUpdate}
                />
                {activeSuggestion && (
                  <EasySetSuggestionBanner
                    suggestion={activeSuggestion}
                    weightLabel={weightLabel}
                    displayWeight={displayWeight}
                    canAddBonusSet={canAddBonusSet}
                    onApplyWeight={
                      activeSuggestion.kind === "increase_weight"
                        ? () => void handleApplyEasyWeight()
                        : undefined
                    }
                    onAddBonusSet={() => void handleAddBonusSet(set)}
                    onDismiss={() => setEasySuggestion(null)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {exerciseSetsComplete && (
          <p className="mt-4 text-sm text-forge-success">
            All sets logged for this exercise.
          </p>
        )}
      </section>
    );
  }

  function renderStepContent() {
    if (!session || !currentStep) return null;

    switch (currentStep.kind) {
      case "overview":
        return (
          <WorkoutEquipmentOverviewCard
            sessionName={session.sessionName}
            equipment={sessionEquipment}
          />
        );
      case "warmup":
        return (
          <WarmupBlockCard
            block={session.warmupBlock!}
            status={session.warmupStatus ?? "pending"}
            durationMs={session.warmupDurationMs}
            isTimerActive={warmupTimer !== null}
            onStartTimer={() => {
              clearTimers();
              setHoldTimerKey(`warmup-${Date.now()}`);
              setHoldTimerRestore(null);
              setWarmupTimer({
                seconds: session.warmupBlock!.durationMinutes * 60,
                label: "Warm-up",
              });
            }}
            onMarkComplete={() => void handleWarmupUpdate("completed")}
            onSkip={() => void handleWarmupUpdate("skipped")}
          />
        );
      case "conditioning":
        return (
          <ConditioningBlockCard
            block={session.conditioningBlock!}
            status={session.conditioningStatus ?? "pending"}
            roundsCompleted={session.conditioningRoundsCompleted ?? 0}
            onLogRound={() => void handleLogConditioningRound()}
            onMarkComplete={() =>
              void handleConditioningUpdate(
                "completed",
                session.conditioningRoundsCompleted ??
                  session.conditioningBlock!.rounds
              )
            }
            onSkip={() => void handleConditioningUpdate("skipped", 0)}
          />
        );
      case "exercise":
        return renderExerciseStep(currentStep);
      case "recovery":
        return (
          <RecoveryBlockCard
            block={session.recoveryBlock!}
            status={session.recoveryStatus ?? "pending"}
            durationMs={session.recoveryDurationMs}
            isTimerActive={recoveryTimer !== null}
            onStartTimer={() => {
              clearTimers();
              setHoldTimerKey(`recovery-${Date.now()}`);
              setHoldTimerRestore(null);
              setRecoveryTimer({
                seconds: session.recoveryBlock!.durationMinutes * 60,
                label: "Recovery",
              });
            }}
            onMarkComplete={() => void handleRecoveryUpdate("completed")}
            onSkip={() => void handleRecoveryUpdate("skipped")}
          />
        );
      case "finish":
        return (
          <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5">
            <h2 className="font-display text-lg font-semibold text-forge-text">
              Ready to wrap up?
            </h2>
            <p className="mt-2 text-sm text-forge-muted">
              You logged {completedCount} of {totalCount} sets. Save this
              workout to count it toward your week.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-forge-muted">
              {session.warmupBlock && (
                <li>
                  Warm-up:{" "}
                  <span className="text-forge-text">
                    {session.warmupStatus === "completed"
                      ? "Done"
                      : session.warmupStatus === "skipped"
                        ? "Skipped"
                        : "Not logged"}
                  </span>
                </li>
              )}
              {session.conditioningBlock && (
                <li>
                  Conditioning:{" "}
                  <span className="text-forge-text">
                    {session.conditioningStatus === "completed"
                      ? `Done · ${session.conditioningRoundsCompleted ?? 0}/${session.conditioningBlock.rounds} rounds`
                      : session.conditioningStatus === "skipped"
                        ? "Skipped"
                        : "Not logged"}
                  </span>
                </li>
              )}
              {session.recoveryBlock && (
                <li>
                  Recovery:{" "}
                  <span className="text-forge-text">
                    {session.recoveryStatus === "completed"
                      ? "Done"
                      : session.recoveryStatus === "skipped"
                        ? "Skipped"
                        : "Not logged"}
                  </span>
                </li>
              )}
            </ul>
          </section>
        );
    }
  }

  if (loading) {
    return <p className="px-6 py-8 text-forge-muted">Loading workout…</p>;
  }

  if (!session || !currentStep) {
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

  const isFirstStep = currentStepIndex === 0;
  const isFinishStep = currentStep.kind === "finish";
  const canContinue =
    !isFinishStep && canAdvanceFromStep(currentStep, session);
  const continueLabel = (() => {
    if (currentStep.kind === "warmup") {
      if (session.conditioningBlock) {
        return `Continue to ${session.conditioningBlock.name}`;
      }
      const first = session.exercises[0]?.name ?? "main work";
      return `Continue to ${first}`;
    }
    if (currentStep.kind === "conditioning") {
      if (session.exercises[0]) {
        return `Continue to ${session.exercises[0].name}`;
      }
      if (session.recoveryBlock) return "Continue to recovery";
      return "Continue to wrap up";
    }
    if (currentStep.kind === "exercise") {
      if (currentStep.exerciseIndex < session.exercises.length - 1) {
        const next = session.exercises[currentStep.exerciseIndex + 1]?.name;
        return `Continue to ${next ?? "next exercise"}`;
      }
      if (session.recoveryBlock) return "Continue to recovery";
      return "Continue to wrap up";
    }
    if (currentStep.kind === "recovery") return "Continue to wrap up";
    return "Continue";
  })();

  return (
    <div className={`${appPagePadding} pb-36`}>
      <button
        type="button"
        onClick={goBack}
        className="mb-4 text-sm font-medium text-forge-steel"
      >
        ← Back to workouts
      </button>

      <WorkoutStepHeader
        stepNumber={currentStepIndex + 1}
        totalSteps={steps.length}
        stepTitle={stepLabel(currentStep, session)}
        sessionName={session.sessionName}
        completedSets={completedCount}
        totalSets={totalCount}
      />

      {maxTestMode && (
        <div className="mb-4 rounded-2xl border border-forge-gold/30 bg-forge-gold/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
            1RM test
          </p>
          <p className="mt-1 text-sm text-forge-muted">
            Warm up, attempt your max single, then tap Record max. Your result
            saves to training maxes when you finish online.
          </p>
        </div>
      )}

      {session.intervalProtocol && (
        <div className="mb-4 rounded-2xl border border-forge-ember/30 bg-forge-ember/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-ember">
            Interval protocol
          </p>
          <p className="mt-1 text-sm text-forge-muted">
            {session.intervalProtocol.mode === "density" &&
              `${session.intervalProtocol.workSeconds}s work / ${session.intervalProtocol.restSeconds}s rest × ${session.intervalProtocol.rounds} rounds per exercise`}
            {session.intervalProtocol.mode === "tabata" &&
              `${session.intervalProtocol.workSeconds}s on / ${session.intervalProtocol.restSeconds}s off × ${session.intervalProtocol.rounds} rounds · ${session.intervalProtocol.betweenExerciseRestSeconds ?? 45}s between exercises`}
            {session.intervalProtocol.mode === "superset_block" &&
              `${Math.round(session.intervalProtocol.workSeconds / 60)} min on / ${Math.round(session.intervalProtocol.restSeconds / 60)} min off per pair`}
          </p>
          {!intervalRun ? (
            <button
              type="button"
              onClick={startIntervalProtocol}
              className="mt-3 min-h-[44px] w-full rounded-xl bg-forge-ember px-4 py-2 text-sm font-semibold text-white"
            >
              {persistedIntervalResume ? "Resume intervals" : "Start intervals"}
            </button>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs text-forge-success">
                Intervals running — listen for loud GO / STOP cues.
              </p>
              {intervalTimerHidden && (
                <button
                  type="button"
                  onClick={() => setIntervalTimerHidden(false)}
                  className="rounded-lg border border-forge-ember/40 px-3 py-1 text-xs font-semibold text-forge-ember"
                >
                  Show timer
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!musicStripDismissed && !spotifyConnected && (
        <div className="mb-4">
          <WorkoutMusicPicker
            variant="compact"
            offline={offline}
            dismissible
            onDismiss={() => setMusicStripDismissed(true)}
          />
        </div>
      )}

      <WorkoutMusicTransport
        enabled={spotifyConnected}
        offline={offline}
      />

      {readiness && currentStepIndex === 0 && (
        <div className="mb-4">
          <WorkoutReadinessStrip readiness={readiness} />
        </div>
      )}

      {coaching?.communityRank && currentStepIndex === 0 && (
        <div className="mb-4">
          <CommunityRankStrip rank={coaching.communityRank} />
        </div>
      )}

      {preWorkoutHype && currentStepIndex === 0 && (
        <div className="mb-4">
          <PreWorkoutHypeBanner message={preWorkoutHype} />
        </div>
      )}

      {offline && (
        <p className="mb-4 text-sm text-forge-steel">Offline mode</p>
      )}

      {renderStepContent()}

      {finishError && (
        <p className="mt-4 text-sm text-forge-coral" role="alert">
          {finishError}
        </p>
      )}

      <div className="mt-8 space-y-3">
        <div className="flex gap-3">
          {!isFirstStep && (
            <button
              type="button"
              disabled={finishing || cancelling}
              onClick={goToPreviousStep}
              className="min-h-[52px] flex-1 rounded-xl border border-[var(--border)] font-medium text-forge-muted disabled:opacity-60"
            >
              Back
            </button>
          )}
          {isFinishStep ? (
            <button
              type="button"
              disabled={finishing || cancelling}
              onClick={() => void handleFinish()}
              className="min-h-[52px] flex-1 rounded-xl bg-forge-ember font-display font-bold text-white disabled:opacity-60"
            >
              {finishing ? "Saving…" : "Finish workout"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canContinue || finishing || cancelling}
              onClick={goToNextStep}
              className="min-h-[52px] flex-1 rounded-xl bg-forge-ember font-display font-bold text-white disabled:opacity-60"
            >
              {continueLabel}
            </button>
          )}
        </div>

        {isFinishStep && (
          <button
            type="button"
            disabled={finishing || cancelling}
            onClick={() => void handleCancel()}
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[var(--border)] font-medium text-forge-muted transition-colors hover:border-forge-coral/40 hover:text-forge-coral disabled:opacity-60"
          >
            {cancelling ? "Discarding…" : "Discard workout"}
          </button>
        )}
      </div>

      {restAwayNotice && (
        <div className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-50 px-4">
          <p
            className="mx-auto max-w-lg rounded-xl border border-forge-success/30 bg-forge-success/10 px-4 py-3 text-center text-sm text-forge-success"
            role="status"
          >
            Rest finished while you were away — ready for your next set.
          </p>
        </div>
      )}

      {warmupTimer && warmupTimer.seconds > 0 && (
        <HoldTimer
          key={holdTimerKey}
          seconds={warmupTimer.seconds}
          label={warmupTimer.label}
          restore={holdTimerRestore}
          onPersist={(state) => persistActiveTimer("warmup", state, { label: warmupTimer.label })}
          onComplete={handleWarmupTimerComplete}
          onStop={handleWarmupTimerStop}
        />
      )}

      {!warmupTimer && recoveryTimer && recoveryTimer.seconds > 0 && (
        <HoldTimer
          key={holdTimerKey}
          seconds={recoveryTimer.seconds}
          label={recoveryTimer.label}
          restore={holdTimerRestore}
          onPersist={(state) =>
            persistActiveTimer("recovery", state, { label: recoveryTimer.label })
          }
          onComplete={handleRecoveryTimerComplete}
          onStop={handleRecoveryTimerStop}
        />
      )}

      {!warmupTimer && !recoveryTimer && timedTimer && timedTimer.seconds > 0 && (
        <HoldTimer
          key={holdTimerKey}
          seconds={timedTimer.seconds}
          label={timedTimer.label}
          restore={holdTimerRestore}
          onPersist={(state) =>
            persistActiveTimer("hold", state, {
              setClientId: timedTimer.setClientId,
              exerciseId: timedTimer.exerciseId,
              label: timedTimer.label,
            })
          }
          onComplete={handleTimedComplete}
          onStop={handleTimedStop}
        />
      )}

      {!warmupTimer &&
        !recoveryTimer &&
        !timedTimer &&
        !intervalRun &&
        restSeconds !== null &&
        restSeconds > 0 && (
          <RestTimer
            key={restTimerKey}
            seconds={restSeconds}
            restore={restTimerRestore}
            onPersist={(state) => persistActiveTimer("rest", state)}
            onComplete={handleRestComplete}
            onSkip={() => handleRestComplete()}
          />
        )}

      {!warmupTimer &&
        !recoveryTimer &&
        !timedTimer &&
        intervalRun &&
        intervalRun.phase !== "done" &&
        !intervalTimerHidden &&
        session.intervalProtocol && (
          <IntervalTimer
            key={intervalTimerKey}
            protocol={session.intervalProtocol}
            state={intervalRun}
            blocks={intervalBlocks}
            suppressInitialWorkCue={intervalCueFromGesture}
            restore={intervalTimerRestore}
            onPersist={(state) =>
              persistActiveTimer("interval", state, {
                intervalPhase: intervalRun.phase,
                intervalRoundIndex: intervalRun.roundIndex,
                intervalBlockIndex: intervalRun.blockIndex,
                intervalSeconds: intervalRun.seconds,
                workoutStepIndex: currentStepIndex,
              })
            }
            onPhaseComplete={() => advanceIntervalPhase()}
            onSkipPhase={() => advanceIntervalPhase()}
            onStop={() => {
              setIntervalTimerHidden(true);
            }}
          />
        )}

      {celebrationPr && coaching && (
        <PrCelebrationModal
          pr={celebrationPr}
          headline={pickPrCelebrationHeadline({
            exerciseLabel: celebrationPr.label,
            weightKg: celebrationPr.weightKg,
            reps: celebrationPr.reps,
            e1rmKg: celebrationPr.e1rmKg,
            goal: coaching.goal as CoachingGoal,
            displayName: coaching.displayName,
            unitSystem: unit,
          })}
          body={pickPrCelebrationBody({
            exerciseLabel: celebrationPr.label,
            weightKg: celebrationPr.weightKg,
            reps: celebrationPr.reps,
            e1rmKg: celebrationPr.e1rmKg,
            goal: coaching.goal as CoachingGoal,
            displayName: coaching.displayName,
            unitSystem: unit,
          })}
          onSaveAsMax={() => {
            setPrSavePending(true);
            setPrSaveMessage(null);
            void (async () => {
              const result = await saveUserOneRepMax(
                celebrationPr.exerciseId,
                celebrationPr.e1rmKg,
                "log_derived"
              );
              const actionError = readActionError(result);
              setPrSavePending(false);
              if (actionError) {
                setPrSaveMessage(actionError);
                return;
              }
              setPrSaveMessage("Saved to your training maxes.");
            })();
          }}
          savePending={prSavePending}
          saveMessage={prSaveMessage}
          onClose={() => {
            setCelebrationPr(null);
            setPrSaveMessage(null);
          }}
        />
      )}

      {maxTestResult && (
        <MaxTestResultModal
          exerciseLabel={maxTestResult.exerciseLabel}
          weightKg={maxTestResult.weightKg}
          saved={maxTestResult.saved}
          onClose={() => setMaxTestResult(null)}
        />
      )}

      {currentStep?.kind === "exercise" && session && (
        <ExerciseSwapSheet
          open={swapSheetOpen}
          sessionClientId={clientId}
          exerciseIndex={currentStep.exerciseIndex}
          exerciseId={session.exercises[currentStep.exerciseIndex]?.exerciseId ?? ""}
          exerciseName={session.exercises[currentStep.exerciseIndex]?.name ?? ""}
          userEquipment={userEquipment}
          onClose={() => setSwapSheetOpen(false)}
          onSwapped={(input) => void handleExerciseSwapped(input)}
        />
      )}

      {swapConfirmation && (
        <div
          className="fixed bottom-28 left-1/2 z-[110] w-[min(20rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-forge-success/30 bg-forge-surface-raised px-4 py-3 text-center shadow-2xl"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-forge-success">
            {swapConfirmation}
          </p>
        </div>
      )}
    </div>
  );
}
