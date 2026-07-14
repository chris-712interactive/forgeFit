"use client";

import { formatShortDate } from "@/lib/workouts/comparison";
import { isCustomWorkoutSession } from "@/lib/workouts/session-source";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import { useState } from "react";

interface WorkoutHistoryListProps {
  sessions: WorkoutSessionRecord[];
  canExportWorkouts?: boolean;
  onViewResults: (clientId: string) => void;
}

export function WorkoutHistoryList({
  sessions,
  canExportWorkouts = false,
  onViewResults,
}: WorkoutHistoryListProps) {
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const completed = sessions
    .filter((session) => session.status === "completed")
    .sort((a, b) =>
      (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt)
    );

  async function handleExport(clientId: string) {
    setExportingId(clientId);
    setExportError(null);
    try {
      const response = await fetch(`/api/workouts/export?sessionId=${clientId}`);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Export failed.");
      }
      const csv = await response.text();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `forgerep-workout-${clientId.slice(0, 8)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExportingId(null);
    }
  }

  if (completed.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-forge-muted">
        Completed workouts will appear here with sets logged and recap details.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {exportError && (
        <p className="text-sm text-forge-coral" role="alert">
          {exportError}
        </p>
      )}
      {completed.map((session) => {
        const completedSets = session.sets.filter((set) => set.completed).length;
        const isCustom = isCustomWorkoutSession(session);
        return (
          <div
            key={session.clientId}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 py-3"
          >
            <button
              type="button"
              onClick={() => onViewResults(session.clientId)}
              className="min-w-0 flex-1 text-left transition-colors hover:text-forge-success"
            >
              <p className="font-medium text-forge-text">
                {session.sessionName}
                {isCustom && (
                  <span className="ml-2 rounded-full bg-forge-gold/15 px-2 py-0.5 text-xs font-semibold text-forge-gold">
                    Custom
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-sm text-forge-muted">
                {formatShortDate(session.completedAt ?? session.startedAt)} ·{" "}
                {completedSets}/{session.sets.length} sets
              </p>
            </button>
            {canExportWorkouts && (
              <button
                type="button"
                disabled={exportingId === session.clientId}
                onClick={() => void handleExport(session.clientId)}
                className="shrink-0 text-xs font-semibold text-forge-steel disabled:opacity-50"
              >
                {exportingId === session.clientId ? "…" : "CSV"}
              </button>
            )}
            <button
              type="button"
              onClick={() => onViewResults(session.clientId)}
              className="shrink-0 text-sm font-semibold text-forge-success"
            >
              Results
            </button>
          </div>
        );
      })}
    </div>
  );
}
