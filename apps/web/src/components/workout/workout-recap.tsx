"use client";

import {
  formatTimedDurationFromMs,
  isTimedExercise,
  timedSetTotalMs,
} from "@forgefit/exercise-db";
import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  formatWeight,
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import { compareSessions, formatShortDate } from "@/lib/workouts/comparison";
import {
  formatRecoveryDuration,
  recoveryEquipmentLabel,
} from "@/lib/workouts/recovery";
import type { DayPlanStatus, WorkoutSessionRecord } from "@/lib/workouts/sessions";
import { getPriorSessionForComparison } from "@/lib/workouts/sessions";
import {
  appPagePadding,
  appSectionStackTight,
} from "@/components/layout/page-layout";
import { WorkoutSyncNotice } from "./workout-sync-notice";

interface WorkoutRecapProps {
  session: WorkoutSessionRecord;
  dayStatus?: DayPlanStatus;
  workoutsTableReady: boolean;
  onBack: () => void;
}

export function WorkoutRecap({
  session,
  dayStatus,
  workoutsTableReady,
  onBack,
}: WorkoutRecapProps) {
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);
  const prior = getPriorSessionForComparison(dayStatus, session.clientId);
  const comparisons = compareSessions(session, prior);
  const completedSets = session.sets.filter((s) => s.completed).length;
  const syncedToAccount = !session.pendingSync;

  return (
    <div className={appPagePadding}>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm font-medium text-forge-steel"
      >
        ← Back to workouts
      </button>

      <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
        Workout recap
      </p>
      <h1 className="font-display text-xl font-bold text-forge-text sm:text-2xl">
        {session.sessionName}
      </h1>
      <p className="mt-2 text-sm text-forge-muted">
        {formatShortDate(session.completedAt ?? session.startedAt)} ·{" "}
        {completedSets}/{session.sets.length} sets logged
      </p>

      {!syncedToAccount && (
        <WorkoutSyncNotice
          workoutsTableReady={workoutsTableReady}
          syncedToAccount={syncedToAccount}
          compact
        />
      )}

      {prior && (
        <p className="mt-3 rounded-xl border border-forge-steel/20 bg-forge-surface-raised px-3 py-2 text-sm text-forge-muted">
          Comparing to your last {session.sessionName} on{" "}
          {formatShortDate(prior.completedAt ?? prior.startedAt)}
        </p>
      )}

      {session.recoveryBlock && (
        <section className="mt-6 rounded-2xl border border-forge-steel/30 bg-forge-steel/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-steel">
            Recovery
          </p>
          <p className="mt-1 font-display font-semibold text-forge-text">
            {session.recoveryBlock.name}
          </p>
          <p className="mt-1 text-sm text-forge-muted">
            {recoveryEquipmentLabel(session.recoveryBlock.equipment)} ·{" "}
            {formatRecoveryDuration(session.recoveryBlock.durationMinutes)}{" "}
            planned
          </p>
          <p className="mt-2 text-sm text-forge-text">
            {session.recoveryStatus === "completed"
              ? "Completed"
              : session.recoveryStatus === "skipped"
                ? "Skipped"
                : "Not logged"}
          </p>
        </section>
      )}

      <div className={`mt-6 sm:mt-8 ${appSectionStackTight}`}>
        {comparisons.map((exercise) => (
          <section
            key={exercise.exerciseId}
            className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-forge-text">
                {exercise.exerciseName}
              </h2>
              {!isTimedExercise(exercise.exerciseId) &&
                exercise.weightDeltaKg != null &&
                exercise.weightDeltaKg !== 0 && (
                <span
                  className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
                    exercise.weightDeltaKg > 0
                      ? "bg-forge-success/15 text-forge-success"
                      : "bg-forge-coral/15 text-forge-coral"
                  }`}
                >
                  {exercise.weightDeltaKg > 0
                    ? "+"
                    : exercise.weightDeltaKg < 0
                      ? "-"
                      : ""}
                  {kgToDisplayValue(Math.abs(exercise.weightDeltaKg), unit)}{" "}
                  {weightLabel} best set
                </span>
              )}
            </div>

            <div className="space-y-2">
              {exercise.currentSets.map((set) => (
                <div
                  key={`${set.exerciseId}-${set.setNumber}`}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    set.completed
                      ? "bg-forge-success/10 text-forge-text"
                      : "bg-forge-surface text-forge-muted"
                  }`}
                >
                  <span>Set {set.setNumber}</span>
                  <span>
                    {set.completed &&
                    (timedSetTotalMs(set, exercise.exerciseId) != null ||
                      (set.reps != null && set.weightKg != null))
                      ? isTimedExercise(exercise.exerciseId)
                        ? formatTimedDurationFromMs(
                            exercise.exerciseId,
                            timedSetTotalMs(set, exercise.exerciseId) ?? 0
                          )
                        : set.weightKg != null && set.reps != null
                          ? `${formatWeight(set.weightKg, unit)} × ${set.reps}`
                          : "—"
                      : "—"}
                  </span>
                </div>
              ))}
            </div>

            {prior && exercise.priorBest && (
              <p className="mt-3 text-xs text-forge-muted">
                Last time best:{" "}
                {isTimedExercise(exercise.exerciseId) ? (
                  <>
                    {formatTimedDurationFromMs(
                      exercise.exerciseId,
                      timedSetTotalMs(
                        {
                          reps: exercise.priorBest.reps,
                        },
                        exercise.exerciseId
                      ) ?? 0
                    )}
                  </>
                ) : (
                  <>
                    {formatWeight(exercise.priorBest.weightKg, unit)} ×{" "}
                    {exercise.priorBest.reps}
                  </>
                )}
                {exercise.currentBest && (
                  <>
                    {" "}
                    → now{" "}
                    {isTimedExercise(exercise.exerciseId) ? (
                      formatTimedDurationFromMs(
                        exercise.exerciseId,
                        timedSetTotalMs(
                          { reps: exercise.currentBest.reps },
                          exercise.exerciseId
                        ) ?? 0
                      )
                    ) : (
                      <>
                        {formatWeight(exercise.currentBest.weightKg, unit)} ×{" "}
                        {exercise.currentBest.reps}
                      </>
                    )}
                  </>
                )}
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
