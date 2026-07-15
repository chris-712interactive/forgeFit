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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-custom-title"
        className="w-full max-w-lg rounded-t-2xl border border-[var(--border)] bg-forge-surface p-5 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="assign-custom-title"
              className="font-display text-lg font-semibold text-forge-text"
            >
              Assign to a day
            </h2>
            <p className="mt-1 text-sm text-forge-muted">{workoutName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-forge-ember"
          >
            Close
          </button>
        </div>

        <label className="mt-5 block space-y-1">
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
                  Show this custom workout alongside whatever is already planned.
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

        <button
          type="button"
          disabled={saving || !dateIso}
          onClick={() =>
            onConfirm({
              scheduledDateIso: dateIso,
              choice: conflict.hasConflict ? choice : "keep_both",
            })
          }
          className="mt-5 min-h-[48px] w-full rounded-xl bg-forge-ember px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Assign to day"}
        </button>
      </div>
    </div>
  );
}
