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
  onStart: () => void;
  onRemove: () => void;
}

export function AssignedCustomWorkoutCard({
  templateName,
  scheduledDateIso,
  replacesProgram,
  exerciseCount,
  starting,
  onStart,
  onRemove,
}: AssignedCustomWorkoutCardProps) {
  const today = browserTodayIsoDate();
  const canStart = canStartAssignedWorkout(scheduledDateIso, today);
  const isFuture = scheduledDateIso > today;

  return (
    <article className="rounded-2xl border border-forge-ember/30 bg-forge-ember/5 p-4">
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
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canStart ? (
          <button
            type="button"
            disabled={starting}
            onClick={onStart}
            className="min-h-[44px] flex-1 rounded-xl bg-forge-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {starting ? "Starting…" : "Start"}
          </button>
        ) : (
          <p className="flex min-h-[44px] flex-1 items-center rounded-xl border border-[var(--border)] px-4 text-sm text-forge-muted">
            Available on {formatShortDate(scheduledDateIso)}
          </p>
        )}
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
