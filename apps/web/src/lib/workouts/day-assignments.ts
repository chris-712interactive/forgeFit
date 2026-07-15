import type { ProgramPlan } from "@forgefit/program-engine";
import {
  buildEffectiveScheduleMap,
  type WorkoutScheduleOverride,
} from "@/lib/workouts/schedule-overrides";
import {
  datesReplacingProgram,
  type WorkoutDayAssignmentView,
} from "./day-assignments-core";

export type { WorkoutDayAssignmentView } from "./day-assignments-core";
export {
  canStartAssignedWorkout,
  datesReplacingProgram,
} from "./day-assignments-core";

/** Program dayIndexes whose effective date is replaced by a custom assignment. */
export function suppressedProgramDayIndexes(
  plan: ProgramPlan,
  overrides: WorkoutScheduleOverride[],
  assignments: Array<
    Pick<WorkoutDayAssignmentView, "scheduledDateIso" | "replacesProgram">
  >,
  referenceDate = new Date()
): Set<number> {
  const replacedDates = datesReplacingProgram(assignments);
  if (replacedDates.size === 0) return new Set();

  const effective = buildEffectiveScheduleMap(plan, overrides, referenceDate);
  const suppressed = new Set<number>();
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
  referenceDate = new Date()
): boolean {
  const effective = buildEffectiveScheduleMap(plan, overrides, referenceDate);
  for (const dateIso of effective.values()) {
    if (dateIso === scheduledDateIso) return true;
  }
  return false;
}
