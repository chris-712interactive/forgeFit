import {
  parseScheduleStartIso,
  toScheduleStartIso,
  type ProgramPlan,
} from "@forgefit/program-engine";
import { todayLocalIsoDate } from "@/lib/datetime/local-date";
import { getUserTimeZone } from "@/lib/datetime/timezone";

/** Local calendar today — browser when no timezone cookie, else member TZ. */
export function todayScheduleStartIso(): string {
  return toScheduleStartIso(new Date());
}

export async function todayScheduleStartIsoForUser(): Promise<string> {
  try {
    const timeZone = await getUserTimeZone();
    return todayLocalIsoDate(new Date(), timeZone);
  } catch {
    // Outside a request (tests) — fall back to the runtime local calendar.
    return todayScheduleStartIso();
  }
}

export function parsePlanStartDateInput(isoDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return null;
  }

  return parseScheduleStartIso(isoDate);
}

/** Earliest allowed start (yesterday) to tolerate client/server timezone skew. */
export function earliestAllowedPlanStartIso(todayIso = todayScheduleStartIso()): string {
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

export async function resolveProgramStartDate(
  isoDate?: string
): Promise<{ startDate: Date } | { error: string }> {
  const todayIso = await todayScheduleStartIsoForUser();

  if (!isoDate) {
    return { startDate: parseScheduleStartIso(todayIso) };
  }

  if (!isValidPlanStartDate(isoDate, todayIso)) {
    return {
      error: "Choose today or a future date for your new plan to start.",
    };
  }

  return { startDate: parsePlanStartDateInput(isoDate)! };
}

export const SCHEDULE_START_DATE_SCHEMA = /^\d{4}-\d{2}-\d{2}$/;
