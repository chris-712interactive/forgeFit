export interface WorkoutDayAssignmentView {
  id: string;
  templateId: string;
  scheduledDateIso: string;
  replacesProgram: boolean;
  templateName: string;
}

/** Dates where at least one assignment replaces the program workout. */
export function datesReplacingProgram(
  assignments: Array<
    Pick<WorkoutDayAssignmentView, "scheduledDateIso" | "replacesProgram">
  >
): Set<string> {
  const dates = new Set<string>();
  for (const row of assignments) {
    if (row.replacesProgram) {
      dates.add(row.scheduledDateIso);
    }
  }
  return dates;
}

export function canStartAssignedWorkout(
  scheduledDateIso: string,
  todayIso: string
): boolean {
  return scheduledDateIso <= todayIso;
}
