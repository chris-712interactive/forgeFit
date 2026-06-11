"use client";

import { formatShortDate } from "@/lib/workouts/comparison";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";

interface WorkoutHistoryListProps {
  sessions: WorkoutSessionRecord[];
  onViewResults: (clientId: string) => void;
}

export function WorkoutHistoryList({
  sessions,
  onViewResults,
}: WorkoutHistoryListProps) {
  const completed = sessions
    .filter((session) => session.status === "completed")
    .sort((a, b) =>
      (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt)
    );

  if (completed.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-forge-muted">
        Completed workouts will appear here with sets logged and recap details.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {completed.map((session) => {
        const completedSets = session.sets.filter((set) => set.completed).length;
        return (
          <button
            key={session.clientId}
            type="button"
            onClick={() => onViewResults(session.clientId)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 py-3 text-left transition-colors hover:border-forge-success/40"
          >
            <div className="min-w-0">
              <p className="font-medium text-forge-text">{session.sessionName}</p>
              <p className="mt-0.5 text-sm text-forge-muted">
                {formatShortDate(session.completedAt ?? session.startedAt)} ·{" "}
                {completedSets}/{session.sets.length} sets
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-forge-success">
              Results
            </span>
          </button>
        );
      })}
    </div>
  );
}
