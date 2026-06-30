import {
  parseScheduleStartIso,
  toScheduleStartIso,
  type ProgramPlan,
} from "@forgefit/program-engine";

export function todayScheduleStartIso(): string {
  return toScheduleStartIso(new Date());
}

export function parsePlanStartDateInput(isoDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return null;
  }

  return parseScheduleStartIso(isoDate);
}

export function isValidPlanStartDate(isoDate: string): boolean {
  const parsed = parsePlanStartDateInput(isoDate);
  if (!parsed) return false;
  return toScheduleStartIso(parsed) >= todayScheduleStartIso();
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

export function resolveProgramStartDate(
  isoDate?: string
): { startDate: Date } | { error: string } {
  if (!isoDate) {
    return { startDate: new Date() };
  }

  if (!isValidPlanStartDate(isoDate)) {
    return {
      error: "Choose today or a future date for your new plan to start.",
    };
  }

  return { startDate: parsePlanStartDateInput(isoDate)! };
}

export const SCHEDULE_START_DATE_SCHEMA = /^\d{4}-\d{2}-\d{2}$/;
