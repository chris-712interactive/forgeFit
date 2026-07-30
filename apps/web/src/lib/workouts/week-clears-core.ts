import type { ProgramPlan } from "@forgefit/program-engine";

export interface ProgramWeekClearView {
  id: string;
  weekStartIso: string;
  programId: string | null;
}

/** True when the active plan week has been cleared by the user. */
export function isProgramWeekCleared(
  weekStartIso: string,
  clears: Array<Pick<ProgramWeekClearView, "weekStartIso">>
): boolean {
  return clears.some((row) => row.weekStartIso === weekStartIso);
}

/**
 * When a week is cleared, every program session in the plan is suppressed
 * for that week (custom assignments remain visible separately).
 */
export function clearedWeekProgramDayIndexes(
  plan: ProgramPlan,
  weekCleared: boolean
): Set<number> {
  if (!weekCleared) return new Set();
  return new Set(plan.week.map((session) => session.dayIndex));
}

/** ISO dates that fall within [weekStartIso, weekEndIso] inclusive. */
export function dateIsoInWeekRange(
  dateIso: string,
  weekStartIso: string,
  weekEndIso: string
): boolean {
  return dateIso >= weekStartIso && dateIso <= weekEndIso;
}
