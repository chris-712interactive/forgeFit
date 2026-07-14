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
