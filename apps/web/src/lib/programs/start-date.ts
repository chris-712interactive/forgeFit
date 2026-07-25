import {
  parseScheduleStartIso,
  toScheduleStartIso,
  type ProgramPlan,
} from "@forgefit/program-engine";

/** Local calendar today in the runtime timezone (safe for client + server). */
export function todayScheduleStartIso(): string {
  return toScheduleStartIso(new Date());
}

export function parsePlanStartDateInput(isoDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return null;
  }

  return parseScheduleStartIso(isoDate);
}

/** Earliest allowed start (yesterday) to tolerate client/server timezone skew. */
export function earliestAllowedPlanStartIso(
  todayIso = todayScheduleStartIso()
): string {
  const earliest = parseScheduleStartIso(todayIso);
  earliest.setDate(earliest.getDate() - 1);
  return toScheduleStartIso(earliest);
}

export function isValidPlanStartDate(
  isoDate: string,
  todayIso = todayScheduleStartIso()
): boolean {
  const parsed = parsePlanStartDateInput(isoDate);
  if (!parsed) return false;
  return toScheduleStartIso(parsed) >= earliestAllowedPlanStartIso(todayIso);
}

export function planScheduleStartIso(plan: ProgramPlan): string {
  return plan.scheduleStartDate ?? plan.generatedAt.slice(0, 10);
}

export function formatPlanStartDateLabel(isoDate: string): string {
  return parseScheduleStartIso(isoDate).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export const SCHEDULE_START_DATE_SCHEMA = /^\d{4}-\d{2}-\d{2}$/;
