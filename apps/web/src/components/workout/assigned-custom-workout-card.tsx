"use client";

import { formatShortDate } from "@/lib/workouts/comparison";
import { canStartAssignedWorkout } from "@/lib/workouts/day-assignments";
import { browserTodayIsoDate } from "@/lib/datetime/local-date";

interface AssignedCustomWorkoutCardProps {
  assignmentId: string;
  templateName: string;
  scheduledDateIso: string;
  replacesProgram: boolean;
  exerciseCount: number;
  starting: boolean;
  inProgressClientId?: string;
  completedClientId?: string;
  completedSets?: number;
  completedTotalSets?: number;
  completedAtIso?: string | null;
  onStart: () => void;
  onContinue: (clientId: string) => void;
  onViewResults: (clientId: string) => void;
  onRemove: () => void;
}

function cardSurfaceClass(inProgress: boolean, isDone: boolean): string {
  if (inProgress) return "border-forge-ember/40 bg-forge-ember/10";
  if (isDone) return "border-forge-success/30 bg-forge-success/5";
  return "border-forge-ember/30 bg-forge-ember/5";
}

export function AssignedCustomWorkoutCard({
  templateName,
  scheduledDateIso,
  replacesProgram,
  exerciseCount,
  starting,
  inProgressClientId,
  completedClientId,
  completedSets = 0,
  completedTotalSets = 0,
  completedAtIso,
  onStart,
  onContinue,
  onViewResults,
  onRemove,
}: AssignedCustomWorkoutCardProps) {
  const today = browserTodayIsoDate();
  const canStart = canStartAssignedWorkout(scheduledDateIso, today);
  const isFuture = scheduledDateIso > today;
  const isDone = Boolean(completedClientId) && !inProgressClientId;
  const surface = cardSurfaceClass(Boolean(inProgressClientId), isDone);

  return (
    <article className={`rounded-2xl border p-4 ${surface}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-forge-ember">
            Custom
            {replacesProgram ? " · Replaces program" : ""}
          </p>
          <p className="text-xs text-forge-muted">
            {formatShortDate(scheduledDateIso)}
            {isFuture ? " · Upcoming" : ""}
          </p>
          <h3 className="font-display font-semibold text-forge-text">
            {templateName}
          </h3>
          <p className="mt-1 text-sm text-forge-muted">
            {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {inProgressClientId ? (
            <button
              type="button"
              onClick={() => onContinue(inProgressClientId)}
              className="rounded-lg bg-forge-ember px-4 py-2 text-sm font-semibold text-white"
            >
              Continue
            </button>
          ) : isDone && completedClientId ? (
            <button
              type="button"
              onClick={() => onViewResults(completedClientId)}
              className="rounded-lg border border-forge-success/40 px-4 py-2 text-sm font-semibold text-forge-success"
            >
              Results
            </button>
          ) : canStart ? (
            <button
              type="button"
              disabled={starting}
              onClick={onStart}
              className="rounded-lg bg-forge-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {starting ? "Starting…" : "Start"}
            </button>
          ) : (
            <p className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-forge-muted">
              Available on {formatShortDate(scheduledDateIso)}
            </p>
          )}
        </div>
      </div>

      {inProgressClientId && (
        <p className="mt-2.5 text-sm font-medium text-forge-ember">
          In progress — pick up where you left off
        </p>
      )}

      {isDone && completedClientId && (
        <button
          type="button"
          onClick={() => onViewResults(completedClientId)}
          className="mt-2 text-left text-sm text-forge-success hover:underline"
        >
          Done {formatShortDate(completedAtIso ?? scheduledDateIso)}
          {completedTotalSets > 0 &&
            ` · ${completedSets}/${completedTotalSets} sets`}
          <span className="ml-1 text-forge-steel">· View results</span>
        </button>
      )}

      <div className="mt-4">
        <button
          type="button"
          onClick={onRemove}
          className="min-h-[44px] rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-forge-muted"
        >
          Remove
        </button>
      </div>
    </article>
  );
}
