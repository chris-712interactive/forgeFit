"use client";

import { addDaysIso } from "@/lib/datetime/local-date";
import {
  buildNutritionHref,
  formatNutritionDayHeading,
  formatNutritionDayShort,
  minNutritionLogDate,
  NUTRITION_LOOKBACK_DAYS,
} from "@/lib/nutrition/date-param";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useMemo } from "react";

interface NutritionDatePickerProps {
  selectedDate: string;
  todayIso: string;
  yesterdayIso: string;
  entryCount?: number;
  /** When embedded on log-macros / build-meal screens */
  compact?: boolean;
  /** Route to update when changing dates (defaults to /nutrition). */
  basePath?: string;
}

export function NutritionDatePicker({
  selectedDate,
  todayIso,
  yesterdayIso,
  entryCount,
  compact = false,
  basePath = "/nutrition",
}: NutritionDatePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateInputId = useId();

  const isToday = selectedDate === todayIso;
  const isYesterday = selectedDate === yesterdayIso;
  const isPastDay = selectedDate < todayIso;
  const minDate = minNutritionLogDate(todayIso);
  const canGoBack = selectedDate > minDate;
  const canGoForward = selectedDate < todayIso;

  const heading = formatNutritionDayHeading(
    selectedDate,
    todayIso,
    yesterdayIso
  );
  const subheading = useMemo(() => {
    if (isToday) {
      return entryCount != null && entryCount > 0
        ? `${entryCount} ${entryCount === 1 ? "entry" : "entries"} logged`
        : "Nothing logged yet — tap + to add food";
    }
    if (entryCount != null && entryCount > 0) {
      return `${entryCount} ${entryCount === 1 ? "entry" : "entries"} on this day`;
    }
    return "No entries yet — you can backfill this day";
  }, [entryCount, isToday]);

  function navigateToDate(date: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (date === todayIso) {
      params.delete("date");
    } else {
      params.set("date", date);
    }
    const query = params.toString();
    router.replace(query ? `${basePath}?${query}` : basePath, {
      scroll: false,
    });
    router.refresh();
  }

  function shiftDays(delta: number) {
    const next = addDaysIso(selectedDate, delta);
    if (next > todayIso) {
      navigateToDate(todayIso);
      return;
    }
    if (next < minDate) return;
    navigateToDate(next);
  }

  return (
    <section
      className={
        compact
          ? "rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4"
          : "rounded-2xl border border-forge-ember/20 bg-gradient-to-br from-forge-surface-raised to-forge-surface p-4 sm:p-5"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-xs font-semibold uppercase tracking-wider text-forge-muted">
            Diary date
          </p>
          <p className="mt-1 truncate font-display text-xl font-bold text-forge-text sm:text-2xl">
            {heading}
          </p>
          <p className="mt-1 text-sm text-forge-muted">{subheading}</p>
        </div>

        <label
          htmlFor={dateInputId}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-forge-surface text-forge-muted transition-colors hover:border-forge-ember/40 hover:text-forge-ember"
          title="Pick a date"
        >
          <CalendarIcon />
          <span className="sr-only">Pick a date</span>
        </label>
        <input
          id={dateInputId}
          type="date"
          value={selectedDate}
          min={minDate}
          max={todayIso}
          onChange={(event) => {
            if (event.target.value) navigateToDate(event.target.value);
          }}
          className="sr-only"
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <NavButton
          label="Previous day"
          disabled={!canGoBack}
          onClick={() => shiftDays(-1)}
        >
          ‹
        </NavButton>

        <div className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-2 text-center">
          <p className="truncate text-sm font-semibold text-forge-text">
            {formatNutritionDayShort(selectedDate)}
          </p>
          {!isToday && (
            <p className="truncate text-xs text-forge-muted">
              {selectedDate}
            </p>
          )}
        </div>

        <NavButton
          label="Next day"
          disabled={!canGoForward}
          onClick={() => shiftDays(1)}
        >
          ›
        </NavButton>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <QuickDateChip
          label="Today"
          active={isToday}
          onClick={() => navigateToDate(todayIso)}
        />
        <QuickDateChip
          label="Yesterday"
          active={isYesterday}
          onClick={() => navigateToDate(yesterdayIso)}
        />
        {!isToday && (
          <button
            type="button"
            onClick={() => navigateToDate(todayIso)}
            className="rounded-full border border-forge-ember/30 bg-forge-ember/10 px-3 py-1.5 text-xs font-semibold text-forge-ember transition-colors hover:bg-forge-ember/15"
          >
            Back to today
          </button>
        )}
      </div>

      {isPastDay && (
        <p className="mt-3 rounded-xl border border-forge-gold/25 bg-forge-gold/5 px-3 py-2 text-sm text-forge-text">
          Logging for a past day. Macro targets reflect your current plan — use
          this to catch up on missed days (up to {NUTRITION_LOOKBACK_DAYS} days
          back).
        </p>
      )}
    </section>
  );
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-forge-surface text-lg font-semibold text-forge-text transition-colors hover:border-forge-ember/40 hover:text-forge-ember disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function QuickDateChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "border-forge-ember bg-forge-ember/15 text-forge-ember"
          : "border-[var(--border)] bg-forge-surface text-forge-muted hover:border-forge-ember/30 hover:text-forge-text"
      }`}
    >
      {label}
    </button>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

/** Client helper for sub-pages that need the selected date in links. */
export function useNutritionSelectedDate(fallbackToday: string): string {
  const searchParams = useSearchParams();
  const param = searchParams.get("date");
  if (!param) return fallbackToday;
  return param;
}

export function useNutritionBackHref(fallbackToday: string): string {
  const searchParams = useSearchParams();
  const date = searchParams.get("date");
  const tab = searchParams.get("tab");
  if (!date && !tab) return "/nutrition";
  return buildNutritionHref({
    date: date ?? undefined,
    tab: tab ?? undefined,
  });
}
