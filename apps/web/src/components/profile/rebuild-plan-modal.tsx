"use client";

import { rebuildProgram } from "@/app/actions/program";
import { PlanScheduleStartField } from "@/components/profile/plan-schedule-start-field";
import {
  formatPlanStartDateLabel,
  todayScheduleStartIso,
} from "@/lib/programs/start-date";
import { resolveLastSessionKindForRegenerate } from "@/lib/programs/recent-training";
import { loadLocalSessionRecords } from "@/lib/workouts/sessions-local";
import { useEffect, useState, useTransition } from "react";

interface RebuildPlanModalProps {
  userId: string;
  onClose: () => void;
  onComplete: (result: {
    error?: string;
    changes?: string[];
    isDeloadWeek?: boolean;
  }) => void;
}

export function RebuildPlanModal({
  userId,
  onClose,
  onComplete,
}: RebuildPlanModalProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scheduleStartDate, setScheduleStartDate] = useState(
    todayScheduleStartIso()
  );

  const todayIso = todayScheduleStartIso();
  const startsToday = scheduleStartDate === todayIso;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function handleRebuild() {
    setError(null);
    startTransition(async () => {
      let lastCompletedSessionKind: string | undefined;
      try {
        const localSessions = await loadLocalSessionRecords(userId);
        lastCompletedSessionKind = resolveLastSessionKindForRegenerate(
          localSessions,
          new Date()
        );
      } catch {
        // IndexedDB unavailable — server will load history
      }

      const result = await rebuildProgram({
        schedule_start_date: startsToday ? undefined : scheduleStartDate,
        last_completed_session_kind: lastCompletedSessionKind,
      });

      if (result.error) {
        setError(result.error);
        onComplete({ error: result.error });
        return;
      }

      onComplete({
        changes: result.changes,
        isDeloadWeek: result.isDeloadWeek,
      });
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rebuild-plan-title"
      onClick={onClose}
    >
      <div
        className="max-h-[min(90dvh,560px)] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--border)] bg-forge-surface-raised shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
                Regenerate workouts
              </p>
              <h2
                id="rebuild-plan-title"
                className="mt-1 font-display text-lg font-bold text-forge-text"
              >
                When should your new plan start?
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-forge-muted hover:text-forge-text"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 text-sm text-forge-muted">
            forgeFit will rebuild this week&apos;s workouts from your current
            settings. Days before your start date stay locked to your existing
            plan.
          </p>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setScheduleStartDate(todayIso)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                startsToday
                  ? "border-forge-ember bg-forge-ember/15 text-forge-ember"
                  : "border-[var(--border)] bg-forge-surface text-forge-muted"
              }`}
            >
              Start today ({formatPlanStartDateLabel(todayIso)})
            </button>
          </div>

          <PlanScheduleStartField
            id="rebuild-schedule-start-date"
            value={scheduleStartDate}
            onChange={setScheduleStartDate}
            description={
              startsToday
                ? "Recommended — new sessions apply from today onward."
                : "Pick a future date if you want to finish this week first."
            }
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={pending}
              onClick={handleRebuild}
              className="min-h-[48px] flex-1 rounded-xl bg-forge-ember px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Rebuilding…" : "Rebuild plan"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onClose}
              className="min-h-[48px] flex-1 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-forge-muted"
            >
              Cancel
            </button>
          </div>

          {error && (
            <p className="text-sm text-forge-coral" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
