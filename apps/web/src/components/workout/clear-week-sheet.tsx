"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { ProgramPlan, WorkoutSession } from "@forgefit/program-engine";
import {
  effectiveScheduledDateIso,
  formatEffectiveSessionDate,
  type WorkoutScheduleOverride,
} from "@/lib/workouts/schedule-overrides";

export interface ClearWeekTemplateOption {
  id: string;
  name: string;
}

interface ClearWeekSheetProps {
  open: boolean;
  plan: ProgramPlan;
  programSessions: WorkoutSession[];
  scheduleOverrides: WorkoutScheduleOverride[];
  templates: ClearWeekTemplateOption[];
  weekStartIso: string;
  weekEndIso: string;
  weekAlreadyCleared: boolean;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onClear: (input: {
    assignments: Array<{ templateId: string; scheduledDateIso: string }>;
    clearExistingAssignmentsInWeek: boolean;
  }) => void;
  onRestore: () => void;
}

export function ClearWeekSheet({
  open,
  plan,
  programSessions,
  scheduleOverrides,
  templates,
  weekStartIso,
  weekEndIso,
  weekAlreadyCleared,
  saving,
  error,
  onClose,
  onClear,
  onRestore,
}: ClearWeekSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [clearExisting, setClearExisting] = useState(false);
  const [picks, setPicks] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setClearExisting(false);
    setPicks({});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const slots = useMemo(() => {
    return programSessions
      .map((session) => {
        const dateIso = effectiveScheduledDateIso(
          session.dayIndex,
          plan,
          scheduleOverrides
        );
        return {
          dayIndex: session.dayIndex,
          name: session.name,
          dateIso,
          dateLabel: formatEffectiveSessionDate(
            session.dayIndex,
            plan,
            scheduleOverrides
          ),
        };
      })
      .sort((a, b) => a.dateIso.localeCompare(b.dateIso));
  }, [plan, programSessions, scheduleOverrides]);

  if (!open || !mounted) return null;

  function handleConfirmClear() {
    const assignments = Object.entries(picks)
      .filter(([, templateId]) => Boolean(templateId))
      .map(([scheduledDateIso, templateId]) => ({
        scheduledDateIso,
        templateId,
      }));
    onClear({
      assignments,
      clearExistingAssignmentsInWeek: clearExisting,
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <button
        type="button"
        aria-label="Close clear week sheet"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-week-title"
        className="relative z-10 flex max-h-[min(92dvh,920px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-forge-surface shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] px-5 pb-3 pt-5">
          <div className="min-w-0">
            <h2
              id="clear-week-title"
              className="font-display text-lg font-semibold text-forge-text"
            >
              {weekAlreadyCleared
                ? "Custom week active"
                : "Clear this week's plan"}
            </h2>
            <p className="mt-1 text-sm text-forge-muted">
              {weekStartIso} → {weekEndIso}
            </p>
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
          {weekAlreadyCleared ? (
            <p className="text-sm text-forge-muted">
              Program workouts for this week are hidden. Assign custom workouts
              from the builder, or restore the generated plan below.
            </p>
          ) : (
            <p className="text-sm text-forge-muted">
              Hide this week&apos;s program workouts so you can run your own
              custom sessions instead. Your generated plan is kept — you can
              restore it anytime.
            </p>
          )}

          {slots.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
                {weekAlreadyCleared
                  ? "Hidden program workouts"
                  : "Program workouts that will be hidden"}
              </p>
              <ul className="space-y-2">
                {slots.map((slot) => (
                  <li
                    key={`${slot.dayIndex}-${slot.dateIso}`}
                    className="rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 py-2"
                  >
                    <p className="font-display text-sm font-semibold text-forge-text">
                      {slot.name}
                    </p>
                    <p className="text-xs text-forge-muted">{slot.dateLabel}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!weekAlreadyCleared && templates.length > 0 && (
            <div className="mt-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-forge-muted">
                Optional — assign custom replacements
              </p>
              <p className="text-sm text-forge-muted">
                Pick a saved template for any day. Leave blank to clear only —
                you can assign later from the custom builder.
              </p>
              {slots.map((slot) => (
                <label
                  key={`pick-${slot.dayIndex}-${slot.dateIso}`}
                  className="block space-y-1"
                >
                  <span className="text-sm font-medium text-forge-text">
                    {slot.name} · {slot.dateLabel}
                  </span>
                  <select
                    value={picks[slot.dateIso] ?? ""}
                    onChange={(event) =>
                      setPicks((prev) => ({
                        ...prev,
                        [slot.dateIso]: event.target.value,
                      }))
                    }
                    className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 text-forge-text outline-none focus:border-forge-ember"
                  >
                    <option value="">No custom yet</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}

              <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] px-3 py-3">
                <input
                  type="checkbox"
                  checked={clearExisting}
                  onChange={(event) => setClearExisting(event.target.checked)}
                  className="mt-1 size-4 accent-forge-ember"
                />
                <span className="text-sm text-forge-muted">
                  Also remove existing custom assignments in this week before
                  applying replacements.
                </span>
              </label>
            </div>
          )}

          {!weekAlreadyCleared && templates.length === 0 && (
            <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] px-3 py-3 text-sm text-forge-muted">
              No saved templates yet. You can still clear the week, then build
              and assign customs afterward.
            </p>
          )}

          {error && (
            <p className="mt-4 text-sm text-forge-coral" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-[var(--border)] px-5 py-4">
          {weekAlreadyCleared ? (
            <button
              type="button"
              disabled={saving}
              onClick={onRestore}
              className="min-h-[48px] w-full rounded-xl border border-forge-steel/40 bg-forge-surface-raised px-4 font-display text-sm font-semibold text-forge-steel disabled:opacity-50"
            >
              {saving ? "Restoring…" : "Restore program week"}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleConfirmClear}
              className="min-h-[48px] w-full rounded-xl bg-forge-ember px-4 font-display text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : Object.values(picks).some(Boolean)
                  ? "Clear week & assign customs"
                  : "Clear week's program workouts"}
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="min-h-[44px] w-full rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-forge-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
