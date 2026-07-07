import { isoWeekdayFromDate, toScheduleStartIso } from "@forgefit/program-engine";
import type { ProgramPlan, WorkoutSession } from "@forgefit/program-engine";
import { getWeekBounds } from "@/lib/home/weekly-stats";
import { addDaysIso } from "@/lib/datetime/local-date";
import {
  planScheduleReferenceDate,
  scheduledDateForDayIndex,
  scheduledDateIsoForPlanDay,
  isPlanScheduleStarted,
} from "@/lib/workouts/schedule-dates";

export interface WorkoutScheduleOverride {
  weekStartIso: string;
  dayIndex: number;
  adjustedDateIso: string;
}

export interface ScheduleAdjustResult {
  overrides: WorkoutScheduleOverride[];
  swappedWithDayIndex?: number;
}

/** Monday ISO date for the active plan week. */
export function planWeekStartIso(
  plan: ProgramPlan,
  referenceDate = new Date()
): string {
  const ref = planScheduleReferenceDate(plan, referenceDate);
  return getWeekBounds(ref).startIso;
}

export function planWeekEndIso(
  plan: ProgramPlan,
  referenceDate = new Date()
): string {
  const ref = planScheduleReferenceDate(plan, referenceDate);
  return getWeekBounds(ref).endIso;
}

export function overridesForWeek(
  overrides: WorkoutScheduleOverride[],
  weekStartIso: string
): WorkoutScheduleOverride[] {
  return overrides.filter((entry) => entry.weekStartIso === weekStartIso);
}

function overrideMapForWeek(
  overrides: WorkoutScheduleOverride[],
  weekStartIso: string
): Map<number, string> {
  return new Map(
    overridesForWeek(overrides, weekStartIso).map((entry) => [
      entry.dayIndex,
      entry.adjustedDateIso,
    ])
  );
}

/** Default calendar date for a plan slot (ignores overrides). */
export function defaultScheduledDateIso(
  dayIndex: number,
  plan: ProgramPlan,
  referenceDate = new Date()
): string {
  return scheduledDateIsoForPlanDay(dayIndex, plan, referenceDate);
}

/** Effective calendar date after applying overrides for the active plan week. */
export function effectiveScheduledDateIso(
  dayIndex: number,
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[] = [],
  referenceDate = new Date()
): string {
  const weekStart = planWeekStartIso(plan, referenceDate);
  const adjusted = overrideMapForWeek(overrides, weekStart).get(dayIndex);
  return adjusted ?? defaultScheduledDateIso(dayIndex, plan, referenceDate);
}

export function effectiveScheduledDate(
  dayIndex: number,
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[] = [],
  referenceDate = new Date()
): Date {
  const iso = effectiveScheduledDateIso(
    dayIndex,
    plan,
    overrides,
    referenceDate
  );
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function isScheduleAdjusted(
  dayIndex: number,
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[] = [],
  referenceDate = new Date()
): boolean {
  return (
    effectiveScheduledDateIso(dayIndex, plan, overrides, referenceDate) !==
    defaultScheduledDateIso(dayIndex, plan, referenceDate)
  );
}

export function formatEffectiveSessionDate(
  dayIndex: number,
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[] = [],
  referenceDate = new Date()
): string {
  const effective = effectiveScheduledDate(
    dayIndex,
    plan,
    overrides,
    referenceDate
  );
  const label = effective.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  if (!isScheduleAdjusted(dayIndex, plan, overrides, referenceDate)) {
    return label;
  }

  const defaultDate = scheduledDateForDayIndex(
    dayIndex,
    planScheduleReferenceDate(plan, referenceDate)
  );
  const movedFrom = defaultDate.toLocaleDateString(undefined, {
    weekday: "short",
  });

  return `${label} · moved from ${movedFrom}`;
}

export function compareSessionsByEffectiveDate(
  a: WorkoutSession,
  b: WorkoutSession,
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[] = [],
  referenceDate = new Date()
): number {
  const aIso = effectiveScheduledDateIso(
    a.dayIndex,
    plan,
    overrides,
    referenceDate
  );
  const bIso = effectiveScheduledDateIso(
    b.dayIndex,
    plan,
    overrides,
    referenceDate
  );
  if (aIso !== bIso) return aIso.localeCompare(bIso);
  return a.dayIndex - b.dayIndex;
}

export function dateIsoWithinPlanWeek(
  dateIso: string,
  plan: ProgramPlan,
  referenceDate = new Date()
): boolean {
  const weekStart = planWeekStartIso(plan, referenceDate);
  const weekEnd = planWeekEndIso(plan, referenceDate);
  return dateIso >= weekStart && dateIso <= weekEnd;
}

export function dayIndexForDateIso(
  dateIso: string,
  plan: ProgramPlan,
  referenceDate = new Date()
): number {
  const ref = planScheduleReferenceDate(plan, referenceDate);
  const { start } = getWeekBounds(ref);
  const target = new Date(`${dateIso}T12:00:00`);
  const diffMs = target.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(0, Math.min(6, diffDays));
}

/** Map each plan slot to its effective ISO date for the active week. */
export function buildEffectiveScheduleMap(
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[] = [],
  referenceDate = new Date()
): Map<number, string> {
  const map = new Map<number, string>();
  for (const session of plan.week) {
    map.set(
      session.dayIndex,
      effectiveScheduledDateIso(
        session.dayIndex,
        plan,
        overrides,
        referenceDate
      )
    );
  }
  return map;
}

function upsertWeekOverride(
  overrides: WorkoutScheduleOverride[],
  weekStartIso: string,
  dayIndex: number,
  adjustedDateIso: string
): WorkoutScheduleOverride[] {
  const withoutDay = overrides.filter(
    (entry) =>
      !(entry.weekStartIso === weekStartIso && entry.dayIndex === dayIndex)
  );
  return [
    ...withoutDay,
    { weekStartIso, dayIndex, adjustedDateIso },
  ];
}

function removeWeekOverride(
  overrides: WorkoutScheduleOverride[],
  weekStartIso: string,
  dayIndex: number
): WorkoutScheduleOverride[] {
  return overrides.filter(
    (entry) =>
      !(entry.weekStartIso === weekStartIso && entry.dayIndex === dayIndex)
  );
}

/**
 * Move a plan slot to another day this week. If the target day already has a
 * workout, the two slots swap effective dates.
 */
export function applyScheduleAdjustment(
  dayIndex: number,
  targetDateIso: string,
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[] = [],
  referenceDate = new Date()
): ScheduleAdjustResult {
  if (!plan.week.some((session) => session.dayIndex === dayIndex)) {
    throw new Error("Workout not found in this week's plan.");
  }

  if (!dateIsoWithinPlanWeek(targetDateIso, plan, referenceDate)) {
    throw new Error("Pick a day within this plan week.");
  }

  const weekStartIso = planWeekStartIso(plan, referenceDate);
  const defaultDate = defaultScheduledDateIso(dayIndex, plan, referenceDate);
  if (targetDateIso === defaultDate) {
    return {
      overrides: removeWeekOverride(overrides, weekStartIso, dayIndex),
    };
  }

  const effectiveMap = buildEffectiveScheduleMap(plan, overrides, referenceDate);
  const currentDate = effectiveMap.get(dayIndex) ?? defaultDate;
  const occupiedBy = [...effectiveMap.entries()].find(
    ([index, dateIso]) => index !== dayIndex && dateIso === targetDateIso
  )?.[0];

  let nextOverrides = upsertWeekOverride(
    overrides,
    weekStartIso,
    dayIndex,
    targetDateIso
  );

  if (occupiedBy != null) {
    nextOverrides = upsertWeekOverride(
      nextOverrides,
      weekStartIso,
      occupiedBy,
      currentDate
    );
    return {
      overrides: nextOverrides,
      swappedWithDayIndex: occupiedBy,
    };
  }

  return { overrides: nextOverrides };
}

/** Reset one plan slot to its default weekday for this week. */
export function resetScheduleAdjustment(
  dayIndex: number,
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[] = [],
  referenceDate = new Date()
): WorkoutScheduleOverride[] {
  const weekStartIso = planWeekStartIso(plan, referenceDate);
  return removeWeekOverride(overrides, weekStartIso, dayIndex);
}

/** Clear all overrides for the active plan week. */
export function resetWeekScheduleAdjustments(
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[] = [],
  referenceDate = new Date()
): WorkoutScheduleOverride[] {
  const weekStartIso = planWeekStartIso(plan, referenceDate);
  return overrides.filter((entry) => entry.weekStartIso !== weekStartIso);
}

export function weekDayOptions(
  plan: ProgramPlan,
  referenceDate = new Date()
): Array<{ dateIso: string; weekdayLabel: string; dayIndex: number }> {
  const ref = planScheduleReferenceDate(plan, referenceDate);
  const { start } = getWeekBounds(ref);
  const options: Array<{
    dateIso: string;
    weekdayLabel: string;
    dayIndex: number;
  }> = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const dateIso = toScheduleStartIso(date);
    options.push({
      dateIso,
      weekdayLabel: date.toLocaleDateString(undefined, { weekday: "short" }),
      dayIndex: isoWeekdayFromDate(date),
    });
  }

  return options;
}

export function sessionNameForDayIndex(
  plan: ProgramPlan,
  dayIndex: number
): string | null {
  return plan.week.find((session) => session.dayIndex === dayIndex)?.name ?? null;
}

/** Whether a workout can be rescheduled (not started or completed this week). */
export function canAdjustSessionSchedule(input: {
  dayIndex: number;
  plan: ProgramPlan;
  inProgress: boolean;
  completedThisWeek: boolean;
}): boolean {
  if (!input.plan.week.some((session) => session.dayIndex === input.dayIndex)) {
    return false;
  }
  return !input.inProgress && !input.completedThisWeek;
}

export function formatPlanSessionDateWithOverrides(
  dayIndex: number,
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[] = [],
  referenceDate = new Date()
): string {
  return effectiveScheduledDate(
    dayIndex,
    plan,
    overrides,
    referenceDate
  ).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function canStartPlanSessionWithOverrides(
  dayIndex: number,
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[] = [],
  referenceDate = new Date()
): boolean {
  if (!isPlanScheduleStarted(plan, referenceDate)) {
    return false;
  }

  const sessionDate = effectiveScheduledDate(
    dayIndex,
    plan,
    overrides,
    referenceDate
  );
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  sessionDate.setHours(0, 0, 0, 0);
  return sessionDate <= today;
}

export function addDaysWithinWeek(
  dateIso: string,
  days: number,
  plan: ProgramPlan,
  referenceDate = new Date()
): string | null {
  const next = addDaysIso(dateIso, days);
  return dateIsoWithinPlanWeek(next, plan, referenceDate) ? next : null;
}
