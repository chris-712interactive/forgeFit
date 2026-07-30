"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { addDaysIso } from "@/lib/datetime/local-date";
import { weekDateRange } from "@/lib/workouts/week-program-clear-core";

export interface ClearWeekTemplateOption {
  id: string;
  name: string;
}

export interface ClearWeekDaySlot {
  dateIso: string;
  weekdayLabel: string;
  /** Program session name scheduled on this date, if any. */
  programSessionName?: string | null;
}

interface ClearWeekCustomSheetProps {
  open: boolean;
  weekStartIso: string;
  weekEndIso: string;
  programCleared: boolean;
  daySlots: ClearWeekDaySlot[];
  templates: ClearWeekTemplateOption[];
  /** Existing custom template id per date (prefill). */
  initialTemplateByDate?: Record<string, string>;
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (input: {
    assignments: Array<{ scheduledDateIso: string; templateId: string }>;
  }) => void;
  onRestoreProgramWeek?: () => void;
}

function formatShortDate(dateIso: string): string {
  const [year, month, day] = dateIso.split("-").map(Number);
  const date = new Date(year!, month! - 1, day!, 12, 0, 0, 0);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ClearWeekCustomSheet({
  open,
  weekStartIso,
  weekEndIso,
  programCleared,
  daySlots,
  templates,
  initialTemplateByDate = {},
  saving,
  error,
  onClose,
  onConfirm,
  onRestoreProgramWeek,
}: ClearWeekCustomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [templateByDate, setTemplateByDate] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const next: Record<string, string> = {};
    for (const slot of daySlots) {
      next[slot.dateIso] = initialTemplateByDate[slot.dateIso] ?? "";
    }
    setTemplateByDate(next);
  }, [open, daySlots, initialTemplateByDate]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const assignedCount = useMemo(
    () => Object.values(templateByDate).filter(Boolean).length,
    [templateByDate]
  );

  if (!open || !mounted) return null;

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
              Clear week &amp; use custom
            </h2>
            <p className="mt-1 text-sm text-forge-muted">
              {formatShortDate(weekStartIso)} – {formatShortDate(weekEndIso)}
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
          <p className="text-sm text-forge-muted">
            Hides this week&apos;s program workouts and replaces custom day
            assignments with the templates you pick below. Leave a day blank for
            rest. Completed history is kept.
          </p>

          {templates.length === 0 && (
            <p className="mt-3 rounded-xl border border-forge-gold/30 bg-forge-gold/5 px-3 py-2 text-sm text-forge-gold">
              Save at least one custom template first (Build custom workout →
              Save), then assign them here.
            </p>
          )}

          <ul className="mt-4 space-y-3">
            {daySlots.map((slot) => (
              <li
                key={slot.dateIso}
                className="rounded-xl border border-[var(--border)] bg-forge-surface-raised p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-display text-sm font-semibold text-forge-text">
                    {slot.weekdayLabel}{" "}
                    <span className="font-sans font-normal text-forge-muted">
                      {formatShortDate(slot.dateIso)}
                    </span>
                  </p>
                  {slot.programSessionName ? (
                    <p className="truncate text-xs text-forge-muted">
                      Was: {slot.programSessionName}
                    </p>
                  ) : (
                    <p className="text-xs text-forge-muted">Rest day</p>
                  )}
                </div>
                <label className="mt-2 block space-y-1">
                  <span className="sr-only">
                    Custom workout for {slot.weekdayLabel}
                  </span>
                  <select
                    value={templateByDate[slot.dateIso] ?? ""}
                    disabled={templates.length === 0 || saving}
                    onChange={(event) =>
                      setTemplateByDate((current) => ({
                        ...current,
                        [slot.dateIso]: event.target.value,
                      }))
                    }
                    className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-3 text-sm text-forge-text outline-none focus:border-forge-ember disabled:opacity-50"
                  >
                    <option value="">None (cleared / rest)</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>

          {error && (
            <p className="mt-3 text-sm text-forge-coral" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 space-y-2 border-t border-[var(--border)] px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              const assignments = weekDateRange(weekStartIso)
                .map((dateIso) => {
                  const templateId = templateByDate[dateIso];
                  if (!templateId) return null;
                  return { scheduledDateIso: dateIso, templateId };
                })
                .filter(
                  (row): row is { scheduledDateIso: string; templateId: string } =>
                    row != null
                );
              onConfirm({ assignments });
            }}
            className="min-h-[48px] w-full rounded-xl bg-forge-ember px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving
              ? "Saving…"
              : assignedCount > 0
                ? `Clear week & assign ${assignedCount}`
                : "Clear week (no customs)"}
          </button>
          {programCleared && onRestoreProgramWeek && (
            <button
              type="button"
              disabled={saving}
              onClick={onRestoreProgramWeek}
              className="min-h-[44px] w-full rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-forge-muted disabled:opacity-50"
            >
              Restore program week
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Build Mon–Sun day slots for the sheet from program week data. */
export function buildClearWeekDaySlots(input: {
  weekStartIso: string;
  programByDate: Map<string, string>;
}): ClearWeekDaySlot[] {
  return Array.from({ length: 7 }, (_, index) => {
    const dateIso = addDaysIso(input.weekStartIso, index);
    const [year, month, day] = dateIso.split("-").map(Number);
    const date = new Date(year!, month! - 1, day!, 12, 0, 0, 0);
    return {
      dateIso,
      weekdayLabel: date.toLocaleDateString(undefined, { weekday: "short" }),
      programSessionName: input.programByDate.get(dateIso) ?? null,
    };
  });
}
