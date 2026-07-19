import { exerciseTracksWeight, resolveExerciseDetail } from "@forgefit/exercise-db";

export const MAX_TEST_SESSION_PREFIX = "1RM Test:";

export function isMaxTestSession(sessionName: string): boolean {
  return sessionName.startsWith(MAX_TEST_SESSION_PREFIX);
}

export function buildMaxTestSessionName(exerciseName: string): string {
  return `${MAX_TEST_SESSION_PREFIX} ${exerciseName}`;
}

/** Exercises that support external load logging and 1RM recording. */
export function isOneRepMaxEligibleExercise(exerciseId: string): boolean {
  return exerciseTracksWeight(exerciseId);
}

export function resolveExerciseLabel(exerciseId: string, fallback?: string): string {
  return resolveExerciseDetail(exerciseId)?.name ?? fallback ?? exerciseId;
}
