import type { ProgramPlan } from "@forgefit/program-engine";
import { planWeekStartIso } from "@/lib/workouts/schedule-overrides";

/** Whether the active plan week is cleared for custom replacement. */
export function isProgramWeekCleared(
  plan: ProgramPlan,
  clearedWeekStarts: readonly string[],
  referenceDate = new Date()
): boolean {
  const weekStartIso = planWeekStartIso(plan, referenceDate);
  return clearedWeekStarts.includes(weekStartIso);
}

/** All plan dayIndexes when the week is cleared; otherwise empty. */
export function clearedWeekProgramDayIndexes(
  plan: ProgramPlan,
  clearedWeekStarts: readonly string[],
  referenceDate = new Date()
): Set<number> {
  if (!isProgramWeekCleared(plan, clearedWeekStarts, referenceDate)) {
    return new Set();
  }
  return new Set(plan.week.map((session) => session.dayIndex));
}
