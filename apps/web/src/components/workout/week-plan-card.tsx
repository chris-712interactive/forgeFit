"use client";

import type { WorkoutSession } from "@forgefit/program-engine";
import { formatShortDate } from "@/lib/workouts/comparison";
import type { DayPlanStatus } from "@/lib/workouts/sessions";

interface WeekPlanCardProps {
  session: WorkoutSession;
  dayStatus?: DayPlanStatus;
  starting: boolean;
  onStart: () => void;
  onContinue: (clientId: string) => void;
  onViewResults: (clientId: string) => void;
}

export function WeekPlanCard({
  session,
  dayStatus,
  starting,
  onStart,
  onContinue,
  onViewResults,
}: WeekPlanCardProps) {
  const inProgress = dayStatus?.inProgress ?? null;
  const completed = dayStatus?.latestCompleted ?? null;
  const isDone = Boolean(completed) && !inProgress;

  const completedSets = completed?.sets.filter((s) => s.completed).length ?? 0;
  const totalSets = completed?.sets.length ?? 0;

  return (
    <article
      className={`rounded-2xl border p-4 ${
        inProgress
          ? "border-forge-ember/40 bg-forge-ember/10"
          : isDone
            ? "border-forge-success/30 bg-forge-success/5"
            : "border-[var(--border)] bg-forge-surface-raised"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isDone && (
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forge-success text-xs font-bold text-white"
                aria-hidden
              >
                ✓
              </span>
            )}
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
              {session.dayLabel}
            </p>
          </div>
          <h3 className="font-display font-semibold text-forge-text">
            {session.name}
          </h3>
          <p className="mt-1 text-sm text-forge-muted">
            {session.exercises.length} exercises · ~{session.estimatedMinutes} min
          </p>
          {inProgress && (
            <p className="mt-1 text-sm font-medium text-forge-ember">
              In progress — pick up where you left off
            </p>
          )}
          {isDone && completed && (
            <button
              type="button"
              onClick={() => onViewResults(completed.clientId)}
              className="mt-2 text-left text-sm text-forge-success hover:underline"
            >
              Done {formatShortDate(completed.completedAt ?? completed.startedAt)}
              {completedSets > 0 && ` · ${completedSets}/${totalSets} sets`}
              <span className="ml-1 text-forge-steel">· View results</span>
            </button>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {inProgress ? (
            <button
              type="button"
              onClick={() => onContinue(inProgress.clientId)}
              className="rounded-lg bg-forge-ember px-4 py-2 text-sm font-semibold text-white"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={starting}
              onClick={onStart}
              className="rounded-lg bg-forge-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {starting ? "Starting…" : isDone ? "Start again" : "Start"}
            </button>
          )}
          {isDone && completed && (
            <button
              type="button"
              onClick={() => onViewResults(completed.clientId)}
              className="rounded-lg border border-forge-success/40 px-4 py-2 text-sm font-semibold text-forge-success"
            >
              Results
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
