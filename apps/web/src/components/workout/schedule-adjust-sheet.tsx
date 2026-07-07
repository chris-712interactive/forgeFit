"use client";

import type { ProgramPlan, WorkoutSession } from "@forgefit/program-engine";
import { useEffect, useMemo, useState } from "react";
import {
  applyScheduleAdjustment,
  buildEffectiveScheduleMap,
  canAdjustSessionSchedule,
  defaultScheduledDateIso,
  effectiveScheduledDateIso,
  formatEffectiveSessionDate,
  isScheduleAdjusted,
  resetScheduleAdjustment,
  resetWeekScheduleAdjustments,
  sessionNameForDayIndex,
  weekDayOptions,
  type WorkoutScheduleOverride,
} from "@/lib/workouts/schedule-overrides";
import type { DayPlanStatus } from "@/lib/workouts/sessions";

interface ScheduleAdjustSheetProps {
  open: boolean;
  plan: ProgramPlan;
  session: WorkoutSession;
  dayStatus?: DayPlanStatus;
  overrides: WorkoutScheduleOverride[];
  saving: boolean;
  onClose: () => void;
  onSave: (overrides: WorkoutScheduleOverride[]) => void;
}

export function ScheduleAdjustSheet({
  open,
  plan,
  session,
  dayStatus,
  overrides,
  saving,
  onClose,
  onSave,
}: ScheduleAdjustSheetProps) {
  const [draftOverrides, setDraftOverrides] =
    useState<WorkoutScheduleOverride[]>(overrides);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraftOverrides(overrides);
    setError(null);
  }, [open, overrides]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const canAdjust = canAdjustSessionSchedule({
    dayIndex: session.dayIndex,
    plan,
    inProgress: Boolean(dayStatus?.inProgress),
    completedThisWeek: Boolean(dayStatus?.latestCompleted),
  });

  const weekOptions = useMemo(() => weekDayOptions(plan), [plan]);
  const effectiveMap = useMemo(
    () => buildEffectiveScheduleMap(plan, draftOverrides),
    [draftOverrides, plan]
  );
  const currentDateIso =
    effectiveMap.get(session.dayIndex) ??
    defaultScheduledDateIso(session.dayIndex, plan);
  const defaultDateIso = defaultScheduledDateIso(session.dayIndex, plan);

  if (!open) return null;

  function selectDate(targetDateIso: string) {
    setError(null);
    try {
      const result = applyScheduleAdjustment(
        session.dayIndex,
        targetDateIso,
        plan,
        draftOverrides
      );
      setDraftOverrides(result.overrides);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not move workout."
      );
    }
  }

  function handleResetDay() {
    setError(null);
    setDraftOverrides(
      resetScheduleAdjustment(session.dayIndex, plan, draftOverrides)
    );
  }

  function handleResetWeek() {
    setError(null);
    setDraftOverrides(resetWeekScheduleAdjustments(plan, draftOverrides));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close schedule adjuster"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-forge-gold">
              Adjust schedule
            </p>
            <h2 className="font-display text-lg font-semibold text-forge-text">
              {session.name}
            </h2>
            <p className="mt-1 text-sm text-forge-muted">
              {formatEffectiveSessionDate(
                session.dayIndex,
                plan,
                draftOverrides
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-forge-muted hover:text-forge-text"
          >
            Close
          </button>
        </div>

        {!canAdjust ? (
          <p className="mt-4 rounded-xl border border-forge-steel/30 bg-forge-surface px-4 py-3 text-sm text-forge-steel">
            This workout is already in progress or completed this week. Finish
            or discard it before moving it on the calendar.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm text-forge-muted">
              Pick another day this week. If that day already has a workout,
              the two sessions swap dates.
            </p>

            <div className="mt-4 grid grid-cols-7 gap-2">
              {weekOptions.map((option) => {
                const occupantDayIndex = [...effectiveMap.entries()].find(
                  ([dayIndex, dateIso]) =>
                    dateIso === option.dateIso && dayIndex !== session.dayIndex
                )?.[0];
                const occupantName =
                  occupantDayIndex != null
                    ? sessionNameForDayIndex(plan, occupantDayIndex)
                    : null;
                const selected = currentDateIso === option.dateIso;
                const isDefault =
                  option.dateIso === defaultDateIso && !isScheduleAdjusted(
                    session.dayIndex,
                    plan,
                    draftOverrides
                  );

                return (
                  <button
                    key={option.dateIso}
                    type="button"
                    disabled={saving}
                    onClick={() => selectDate(option.dateIso)}
                    className={`min-h-[72px] rounded-xl border px-1 py-2 text-center transition-colors disabled:opacity-50 ${
                      selected
                        ? "border-forge-ember bg-forge-ember/15 text-forge-ember"
                        : "border-[var(--border)] bg-forge-surface text-forge-text hover:border-forge-ember/40"
                    }`}
                  >
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-forge-muted">
                      {option.weekdayLabel}
                    </span>
                    <span className="mt-1 block text-sm font-semibold">
                      {option.dateIso.slice(8)}
                    </span>
                    {occupantName && !selected && (
                      <span className="mt-1 block truncate text-[10px] text-forge-muted">
                        {occupantName}
                      </span>
                    )}
                    {isDefault && selected && (
                      <span className="mt-1 block text-[10px] text-forge-muted">
                        Default
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleResetDay}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-forge-muted hover:text-forge-text disabled:opacity-50"
              >
                Reset this workout
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleResetWeek}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-forge-muted hover:text-forge-text disabled:opacity-50"
              >
                Reset week
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="mt-4 text-sm text-forge-coral" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] flex-1 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-forge-text"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !canAdjust}
            onClick={() => onSave(draftOverrides)}
            className="min-h-[48px] flex-1 rounded-xl bg-forge-ember px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
