"use client";

import { browserTodayIsoDate } from "@/lib/datetime/local-date";
import { useEffect, useMemo, useState } from "react";

export type AssignConflictChoice = "replace" | "keep_both";

export interface AssignConflictInfo {
  hasConflict: boolean;
  label: string;
}

interface AssignCustomWorkoutSheetProps {
  open: boolean;
  workoutName: string;
  resolveConflict: (scheduledDateIso: string) => AssignConflictInfo;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (input: {
    scheduledDateIso: string;
    choice: AssignConflictChoice;
  }) => void;
}

export function AssignCustomWorkoutSheet({
  open,
  workoutName,
  resolveConflict,
  saving,
  error,
  onClose,
  onConfirm,
}: AssignCustomWorkoutSheetProps) {
  const today = browserTodayIsoDate();
  const [dateIso, setDateIso] = useState(today);
  const [choice, setChoice] = useState<AssignConflictChoice>("keep_both");

  useEffect(() => {
    if (!open) return;
    setDateIso(today);
    setChoice("keep_both");
  }, [open, today]);

  const conflict = useMemo(
    () => resolveConflict(dateIso),
    [dateIso, resolveConflict]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close assign sheet"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-custom-title"
        className="relative z-10 flex max-h-[min(92dvh,920px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-forge-surface shadow-xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] px-5 pb-3 pt-5">
          <div className="min-w-0">
            <h2
              id="assign-custom-title"
              className="font-display text-lg font-semibold text-forge-text"
            >
              Assign to a day
            </h2>
            <p className="mt-1 truncate text-sm text-forge-muted">{workoutName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-sm font-semibold text-forge-ember"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
              Date
            </span>
            <input
              type="date"
              min={today}
              value={dateIso}
              onChange={(event) => setDateIso(event.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 text-forge-text outline-none focus:border-forge-ember"
            />
          </label>

          {conflict.hasConflict && (
            <fieldset className="mt-4 space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
                This day already has a workout
              </legend>
              <p className="text-sm text-forge-muted">{conflict.label}</p>
              <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-3">
                <input
                  type="radio"
                  name="assign-conflict"
                  checked={choice === "replace"}
                  onChange={() => setChoice("replace")}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold text-forge-text">
                    Replace
                  </span>
                  <span className="text-xs text-forge-muted">
                    Hide the program workout for this day and remove other custom
                    assignments on this date.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] p-3">
                <input
                  type="radio"
                  name="assign-conflict"
                  checked={choice === "keep_both"}
                  onChange={() => setChoice("keep_both")}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold text-forge-text">
                    Keep both
                  </span>
                  <span className="text-xs text-forge-muted">
                    Show this custom workout alongside whatever is already
                    planned.
                  </span>
                </span>
              </label>
            </fieldset>
          )}

          {error && (
            <p className="mt-3 text-sm text-forge-coral" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-[var(--border)] px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            disabled={saving || !dateIso}
            onClick={() =>
              onConfirm({
                scheduledDateIso: dateIso,
                choice: conflict.hasConflict ? choice : "keep_both",
              })
            }
            className="min-h-[48px] w-full rounded-xl bg-forge-ember px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Assign to day"}
          </button>
        </div>
      </div>
    </div>
  );
}
