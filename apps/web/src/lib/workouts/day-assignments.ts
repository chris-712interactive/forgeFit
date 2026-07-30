import type { ProgramPlan } from "@forgefit/program-engine";
import {
  buildEffectiveScheduleMap,
  type WorkoutScheduleOverride,
} from "@/lib/workouts/schedule-overrides";
import {
  datesReplacingProgram,
  type WorkoutDayAssignmentView,
} from "./day-assignments-core";
import { clearedWeekProgramDayIndexes } from "./week-clears";

export type { WorkoutDayAssignmentView } from "./day-assignments-core";
export {
  canStartAssignedWorkout,
  completedCustomSessionForAssignment,
  datesReplacingProgram,
  inProgressCustomSessionForAssignment,
} from "./day-assignments-core";

/** Program dayIndexes whose effective date is replaced by a custom assignment. */
export function suppressedProgramDayIndexes(
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[],
  assignments: Array<
    Pick<WorkoutDayAssignmentView, "scheduledDateIso" | "replacesProgram">
  >,
  referenceDate = new Date(),
  clearedWeekStarts: readonly string[] = []
): Set<number> {
  const suppressed = clearedWeekProgramDayIndexes(
    plan,
    clearedWeekStarts,
    referenceDate
  );
  if (suppressed.size > 0) {
    return suppressed;
  }

  const replacedDates = datesReplacingProgram(assignments);
  if (replacedDates.size === 0) return new Set();

  const effective = buildEffectiveScheduleMap(plan, overrides, referenceDate);
  for (const [dayIndex, dateIso] of effective) {
    if (replacedDates.has(dateIso)) {
      suppressed.add(dayIndex);
    }
  }
  return suppressed;
}

/** True when a calendar date already has a program session this week. */
export function dateHasProgramSession(
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[],
  scheduledDateIso: string,
  referenceDate = new Date(),
  clearedWeekStarts: readonly string[] = []
): boolean {
  const suppressed = suppressedProgramDayIndexes(
    plan,
    overrides,
    [],
    referenceDate,
    clearedWeekStarts
  );
  const effective = buildEffectiveScheduleMap(plan, overrides, referenceDate);
  for (const [dayIndex, dateIso] of effective) {
    if (dateIso === scheduledDateIso && !suppressed.has(dayIndex)) {
      return true;
    }
  }
  return false;
}
