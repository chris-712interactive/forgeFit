import { getWeekBounds } from "@/lib/home/weekly-stats";
import { planScheduleStartIso } from "@/lib/programs/start-date";
import {
  parseScheduleStartIso,
  toScheduleStartIso,
  type ProgramPlan,
} from "@forgefit/program-engine";

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Calendar date for a plan weekday (Mon=0 … Sun=6) in the reference week. */
export function scheduledDateForDayIndex(
  dayIndex: number,
  referenceDate = new Date()
): Date {
  const { start } = getWeekBounds(referenceDate);
  const date = new Date(start);
  date.setDate(start.getDate() + dayIndex);
  return date;
}

export function formatScheduledSessionDate(
  dayIndex: number,
  referenceDate = new Date()
): string {
  return scheduledDateForDayIndex(dayIndex, referenceDate).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "short",
      day: "numeric",
    }
  );
}

/** Week to use when mapping plan dayIndex values to calendar dates. */
export function planScheduleReferenceDate(
  plan: ProgramPlan,
  referenceDate = new Date()
): Date {
  const startDate = parseScheduleStartIso(planScheduleStartIso(plan));
  const today = startOfDay(referenceDate);

  if (today < startOfDay(startDate)) {
    return startDate;
  }

  return referenceDate;
}

export function formatPlanSessionDate(
  dayIndex: number,
  plan: ProgramPlan,
  referenceDate = new Date()
): string {
  return formatScheduledSessionDate(
    dayIndex,
    planScheduleReferenceDate(plan, referenceDate)
  );
}

/** ISO calendar date (YYYY-MM-DD) when this plan slot occurs in the active week. */
export function scheduledDateIsoForPlanDay(
  dayIndex: number,
  plan: ProgramPlan,
  referenceDate = new Date()
): string {
  return toScheduleStartIso(
    scheduledDateForDayIndex(
      dayIndex,
      planScheduleReferenceDate(plan, referenceDate)
    )
  );
}

export function sessionDateIso(session: {
  startedAt: string;
  completedAt: string | null;
}): string {
  return (session.completedAt ?? session.startedAt).slice(0, 10);
}

/** True when a logged session belongs to this plan week's calendar slot (not just weekday index). */
export function sessionMatchesScheduledPlanDay(
  session: { startedAt: string; completedAt: string | null },
  dayIndex: number,
  plan: ProgramPlan,
  referenceDate = new Date()
): boolean {
  return (
    sessionDateIso(session) ===
    scheduledDateIsoForPlanDay(dayIndex, plan, referenceDate)
  );
}

export function isPlanScheduleStarted(
  plan: ProgramPlan,
  referenceDate = new Date()
): boolean {
  const startDate = parseScheduleStartIso(planScheduleStartIso(plan));
  return startOfDay(referenceDate) >= startOfDay(startDate);
}

export function isSessionScheduledOnOrBeforeToday(
  dayIndex: number,
  plan: ProgramPlan,
  referenceDate = new Date()
): boolean {
  const sessionDate = scheduledDateForDayIndex(
    dayIndex,
    planScheduleReferenceDate(plan, referenceDate)
  );
  return startOfDay(sessionDate) <= startOfDay(referenceDate);
}

export function canStartPlanSession(
  dayIndex: number,
  plan: ProgramPlan,
  referenceDate = new Date()
): boolean {
  return (
    isPlanScheduleStarted(plan, referenceDate) &&
    isSessionScheduledOnOrBeforeToday(dayIndex, plan, referenceDate)
  );
}
