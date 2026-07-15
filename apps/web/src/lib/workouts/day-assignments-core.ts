import type { WorkoutSessionRecord } from "./sessions";
import { isCustomWorkoutSession } from "./session-source";
import { todayLocalIsoDate } from "@/lib/datetime/local-date";

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

function sessionCalendarDate(
  session: Pick<WorkoutSessionRecord, "completedAt" | "startedAt">,
  timeZone = "UTC"
): string {
  const anchor = session.completedAt ?? session.startedAt;
  return todayLocalIsoDate(new Date(anchor), timeZone);
}

/** Latest completed custom session for an assigned template on its scheduled day. */
export function completedCustomSessionForAssignment(
  assignment: Pick<WorkoutDayAssignmentView, "templateId" | "scheduledDateIso">,
  sessions: WorkoutSessionRecord[],
  timeZone = "UTC"
): WorkoutSessionRecord | null {
  const completed = sessions.filter(
    (session) =>
      session.status === "completed" &&
      isCustomWorkoutSession(session) &&
      session.templateId === assignment.templateId
  );
  if (completed.length === 0) return null;

  const onScheduledDate = completed.filter(
    (session) =>
      sessionCalendarDate(session, timeZone) === assignment.scheduledDateIso
  );
  const pool = onScheduledDate.length > 0 ? onScheduledDate : completed;

  return (
    pool.sort((a, b) =>
      (b.completedAt ?? b.startedAt).localeCompare(
        a.completedAt ?? a.startedAt
      )
    )[0] ?? null
  );
}
