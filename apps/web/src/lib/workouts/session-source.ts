import type { WorkoutSessionRecord } from "./sessions";

/** Sentinel day_index for custom / imported sessions (not tied to program week). */
export const CUSTOM_DAY_INDEX = -1;

export type WorkoutSessionSource = "program" | "custom" | "imported";

export const MAX_CUSTOM_EXERCISES = 20;
export const MAX_WORKOUT_IMPORT_BYTES = 512 * 1024;

export function isCustomWorkoutSession(
  session: Pick<WorkoutSessionRecord, "dayIndex" | "sessionSource">
): boolean {
  return (
    session.sessionSource === "custom" ||
    session.sessionSource === "imported" ||
    session.dayIndex === CUSTOM_DAY_INDEX
  );
}

/** In-progress custom/imported sessions, newest first. */
export function listInProgressCustomSessions<
  T extends Pick<
    WorkoutSessionRecord,
    "status" | "dayIndex" | "sessionSource" | "startedAt"
  >,
>(sessions: T[]): T[] {
  return sessions
    .filter(
      (session) =>
        session.status === "in_progress" && isCustomWorkoutSession(session)
    )
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

/** Custom in-progress sessions that are not already shown on an assigned-day card. */
export function listUnassignedInProgressCustomSessions<
  T extends Pick<
    WorkoutSessionRecord,
    "clientId" | "status" | "dayIndex" | "sessionSource" | "startedAt"
  >,
>(sessions: T[], assignedClientIds: Iterable<string>): T[] {
  const assigned = new Set(assignedClientIds);
  return listInProgressCustomSessions(sessions).filter(
    (session) => !assigned.has(session.clientId)
  );
}
