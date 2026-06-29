"use client";

import { formatNutritionDayShort } from "@/lib/nutrition/date-param";

interface CopyDayPanelProps {
  isViewingToday: boolean;
  selectedDate: string;
  copySourceDate: string;
  copySourceCount: number;
  copying: boolean;
  copyError: string | null;
  onCopy: () => void;
  compact?: boolean;
}

export function CopyDayPanel({
  isViewingToday,
  selectedDate,
  copySourceDate,
  copySourceCount,
  copying,
  copyError,
  onCopy,
  compact = false,
}: CopyDayPanelProps) {
  if (copySourceCount <= 0) return null;

  return (
    <section
      className={
        compact
          ? "rounded-xl border border-dashed border-[var(--border)] bg-forge-surface px-4 py-3"
          : "rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5"
      }
    >
      <h2
        className={
          compact
            ? "font-display text-sm font-semibold text-forge-text"
            : "font-display text-sm font-semibold uppercase tracking-wider text-forge-muted"
        }
      >
        {isViewingToday ? "Copy yesterday" : "Copy previous day"}
      </h2>
      <p className="mt-1 text-sm text-forge-muted">
        {isViewingToday
          ? "Duplicate everything you logged yesterday onto today."
          : `Fill ${formatNutritionDayShort(selectedDate)} from ${formatNutritionDayShort(copySourceDate)}.`}
      </p>
      <button
        type="button"
        disabled={copying}
        onClick={onCopy}
        className="mt-3 rounded-xl bg-forge-surface px-4 py-2.5 text-sm font-semibold text-forge-steel ring-1 ring-[var(--border)] transition-colors hover:text-forge-ember disabled:opacity-50"
      >
        {copying
          ? "Copying…"
          : `Copy ${copySourceCount} ${copySourceCount === 1 ? "entry" : "entries"}`}
      </button>
      {copyError && <p className="mt-2 text-sm text-forge-coral">{copyError}</p>}
    </section>
  );
}
