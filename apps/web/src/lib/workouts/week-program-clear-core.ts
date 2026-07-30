import type { ProgramPlan, WorkoutSession } from "@forgefit/program-engine";
import { addDaysIso } from "@/lib/datetime/local-date";
import {
  buildEffectiveScheduleMap,
  type WorkoutScheduleOverride,
} from "@/lib/workouts/schedule-overrides";

export interface WeekCustomAssignmentInput {
  scheduledDateIso: string;
  templateId: string;
}

export interface WeekReplacePlan {
  weekStartIso: string;
  weekEndIso: string;
  assignments: WeekCustomAssignmentInput[];
}

/** True when the active plan week is marked cleared of program workouts. */
export function isProgramWeekCleared(
  weekStartIso: string,
  clearedWeekStarts: Iterable<string>
): boolean {
  for (const cleared of clearedWeekStarts) {
    if (cleared === weekStartIso) return true;
  }
  return false;
}

/**
 * When the program week is cleared, every plan dayIndex is suppressed.
 * Otherwise falls back to per-date replaces_program assignments.
 */
export function suppressedProgramDayIndexesForWeek(input: {
  plan: ProgramPlan;
  overrides: WorkoutScheduleOverride[];
  assignments: Array<{ scheduledDateIso: string; replacesProgram: boolean }>;
  weekStartIso: string;
  clearedWeekStarts: Iterable<string>;
  referenceDate?: Date;
}): Set<number> {
  if (isProgramWeekCleared(input.weekStartIso, input.clearedWeekStarts)) {
    return new Set(input.plan.week.map((session) => session.dayIndex));
  }

  const replacedDates = new Set<string>();
  for (const row of input.assignments) {
    if (row.replacesProgram) replacedDates.add(row.scheduledDateIso);
  }
  if (replacedDates.size === 0) return new Set();

  const effective = buildEffectiveScheduleMap(
    input.plan,
    input.overrides,
    input.referenceDate
  );
  const suppressed = new Set<number>();
  for (const [dayIndex, dateIso] of effective) {
    if (replacedDates.has(dateIso)) suppressed.add(dayIndex);
  }
  return suppressed;
}

/** Program sessions in the active week with their effective calendar dates. */
export function programWeekSlots(
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[],
  referenceDate = new Date()
): Array<{ dayIndex: number; dateIso: string; session: WorkoutSession }> {
  const effective = buildEffectiveScheduleMap(plan, overrides, referenceDate);
  return [...plan.week]
    .map((session) => ({
      dayIndex: session.dayIndex,
      dateIso: effective.get(session.dayIndex) ?? "",
      session,
    }))
    .filter((row) => Boolean(row.dateIso))
    .sort((a, b) => a.dateIso.localeCompare(b.dateIso));
}

/** Monday–Sunday ISO dates for a week starting on `weekStartIso`. */
export function weekDateRange(weekStartIso: string): string[] {
  return Array.from({ length: 7 }, (_, index) =>
    addDaysIso(weekStartIso, index)
  );
}

export function validateWeekReplaceAssignments(
  weekStartIso: string,
  assignments: WeekCustomAssignmentInput[]
): { ok: true } | { ok: false; error: string } {
  const dates = new Set(weekDateRange(weekStartIso));
  const seen = new Set<string>();

  for (const row of assignments) {
    if (!dates.has(row.scheduledDateIso)) {
      return {
        ok: false,
        error: `Assignment date ${row.scheduledDateIso} is outside the selected week.`,
      };
    }
    if (!row.templateId) {
      return { ok: false, error: "Each assignment needs a template." };
    }
    if (seen.has(row.scheduledDateIso)) {
      return {
        ok: false,
        error: `Duplicate assignment for ${row.scheduledDateIso}.`,
      };
    }
    seen.add(row.scheduledDateIso);
  }

  return { ok: true };
}
