import type { ProgramPlan } from "@forgefit/program-engine";
import {
  buildEffectiveScheduleMap,
  planWeekStartIso,
  type WorkoutScheduleOverride,
} from "@/lib/workouts/schedule-overrides";
import type { WorkoutDayAssignmentView } from "./day-assignments-core";
import { suppressedProgramDayIndexesForWeek } from "./week-program-clear-core";

export type { WorkoutDayAssignmentView } from "./day-assignments-core";
export {
  canStartAssignedWorkout,
  completedCustomSessionForAssignment,
  datesReplacingProgram,
  inProgressCustomSessionForAssignment,
} from "./day-assignments-core";

/**
 * Program dayIndexes hidden on the hub — either the whole week is cleared,
 * or individual dates have replaces_program custom assignments.
 */
export function suppressedProgramDayIndexes(
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[],
  assignments: Array<
    Pick<WorkoutDayAssignmentView, "scheduledDateIso" | "replacesProgram">
  >,
  referenceDate = new Date(),
  clearedWeekStarts: Iterable<string> = []
): Set<number> {
  return suppressedProgramDayIndexesForWeek({
    plan,
    overrides,
    assignments,
    weekStartIso: planWeekStartIso(plan, referenceDate),
    clearedWeekStarts,
    referenceDate,
  });
}

/** True when a calendar date already has a program session this week. */
export function dateHasProgramSession(
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[],
  scheduledDateIso: string,
  referenceDate = new Date()
): boolean {
  const effective = buildEffectiveScheduleMap(plan, overrides, referenceDate);
  for (const dateIso of effective.values()) {
    if (dateIso === scheduledDateIso) return true;
  }
  return false;
}
