import type { MaxTestSetRole } from "@forgefit/offline-sync";
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

export function isMaxTestAttemptSet(
  set: Pick<{ setRole?: MaxTestSetRole }, "setRole">
): boolean {
  return set.setRole === "max_attempt";
}

export function isMaxTestWarmupSet(
  set: Pick<{ setRole?: MaxTestSetRole }, "setRole">
): boolean {
  return set.setRole === "warmup";
}

/** Default roles for a new 1RM test: one warmup slot + one max attempt. */
export const DEFAULT_MAX_TEST_SET_ROLES: MaxTestSetRole[] = [
  "warmup",
  "max_attempt",
];
