"use client";

import { useUnitPreference } from "@/components/units/unit-preference-provider";
import {
  formatWeight,
  kgToDisplayValue,
  weightUnitLabel,
} from "@/lib/units/measurements";
import { compareSessions, formatShortDate } from "@/lib/workouts/comparison";
import type { DayPlanStatus, WorkoutSessionRecord } from "@/lib/workouts/sessions";
import { getPriorSessionForComparison } from "@/lib/workouts/sessions";
import { WorkoutSyncNotice } from "./workout-sync-notice";

interface WorkoutRecapProps {
  session: WorkoutSessionRecord;
  dayStatus?: DayPlanStatus;
  workoutsTableReady: boolean;
  onBack: () => void;
  onStartAgain?: () => void;
}

export function WorkoutRecap({
  session,
  dayStatus,
  workoutsTableReady,
  onBack,
  onStartAgain,
}: WorkoutRecapProps) {
  const unit = useUnitPreference();
  const weightLabel = weightUnitLabel(unit);
  const prior = getPriorSessionForComparison(dayStatus, session.clientId);
  const comparisons = compareSessions(session, prior);
  const completedSets = session.sets.filter((s) => s.completed).length;
  const syncedToAccount = !session.pendingSync;

  return (
    <div className="px-4 py-6 pb-36 sm:px-6 sm:py-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm font-medium text-forge-steel"
      >
        ← Back to plan
      </button>

      <p className="text-xs font-semibold uppercase tracking-wider text-forge-success">
        Completed
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

      <div className="mt-6 space-y-5">
        {comparisons.map((exercise) => (
          <section
            key={exercise.exerciseId}
            className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-forge-text">
                {exercise.exerciseName}
              </h2>
              {exercise.weightDeltaKg != null && exercise.weightDeltaKg !== 0 && (
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
                    {set.completed && set.weightKg != null && set.reps != null
                      ? `${formatWeight(set.weightKg, unit)} × ${set.reps}`
                      : "—"}
                  </span>
                </div>
              ))}
            </div>

            {prior && exercise.priorBest && (
              <p className="mt-3 text-xs text-forge-muted">
                Last time best:{" "}
                {formatWeight(exercise.priorBest.weightKg, unit)} ×{" "}
                {exercise.priorBest.reps}
                {exercise.currentBest && (
                  <>
                    {" "}
                    → now {formatWeight(exercise.currentBest.weightKg, unit)} ×{" "}
                    {exercise.currentBest.reps}
                  </>
                )}
              </p>
            )}
          </section>
        ))}
      </div>

      {onStartAgain && (
        <button
          type="button"
          onClick={onStartAgain}
          className="mt-8 flex min-h-[52px] w-full items-center justify-center rounded-xl border border-forge-ember bg-forge-ember/10 font-display font-bold text-forge-ember"
        >
          Start this day again
        </button>
      )}
    </div>
  );
}
