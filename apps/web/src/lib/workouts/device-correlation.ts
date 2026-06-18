import type { ExerciseSessionSummary } from "@forgefit/integrations";

export type DeviceMatchConfidence = "high" | "medium" | "low" | "none";

export interface WorkoutSessionWindow {
  id: string;
  startedAt: string;
  completedAt: string;
}

export interface ExerciseMatchCandidate {
  exercise: ExerciseSessionSummary;
  overlapRatio: number;
  confidence: DeviceMatchConfidence;
}

const SESSION_START_BUFFER_MS = 5 * 60 * 1000;
const SESSION_END_BUFFER_MS = 15 * 60 * 1000;
const MIN_OVERLAP_RATIO = 0.4;

const LIFT_EXERCISE_TYPES = new Set([
  "WEIGHT_TRAINING",
  "WORKOUT",
  "STRENGTH_TRAINING",
  "FUNCTIONAL_STRENGTH_TRAINING",
  "TRADITIONAL_STRENGTH_TRAINING",
  "CROSS_TRAINING",
  "SPORT",
]);

function sessionMs(iso: string): number {
  return Date.parse(iso);
}

function overlapMs(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): number {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return Math.max(0, end - start);
}

export function overlapRatioForWindows(
  sessionStartMs: number,
  sessionEndMs: number,
  exerciseStartMs: number,
  exerciseEndMs: number
): number {
  const intersection = overlapMs(
    sessionStartMs,
    sessionEndMs,
    exerciseStartMs,
    exerciseEndMs
  );
  if (intersection <= 0) return 0;

  const sessionDuration = Math.max(1, sessionEndMs - sessionStartMs);
  const exerciseDuration = Math.max(1, exerciseEndMs - exerciseStartMs);
  return intersection / Math.min(sessionDuration, exerciseDuration);
}

export function confidenceFromOverlap(ratio: number): DeviceMatchConfidence {
  if (ratio >= 0.75) return "high";
  if (ratio >= 0.5) return "medium";
  if (ratio >= MIN_OVERLAP_RATIO) return "low";
  return "none";
}

function expandedSessionWindow(session: WorkoutSessionWindow): {
  startMs: number;
  endMs: number;
} {
  const startMs = sessionMs(session.startedAt) - SESSION_START_BUFFER_MS;
  const endMs = sessionMs(session.completedAt) + SESSION_END_BUFFER_MS;
  return { startMs, endMs };
}

function liftTypeScore(exerciseType: string | null): number {
  if (!exerciseType) return 0;
  return LIFT_EXERCISE_TYPES.has(exerciseType.toUpperCase()) ? 1 : 0;
}

export function findBestExerciseMatch(
  session: WorkoutSessionWindow,
  exercises: ExerciseSessionSummary[]
): ExerciseMatchCandidate | null {
  const { startMs, endMs } = expandedSessionWindow(session);

  let best: ExerciseMatchCandidate | null = null;

  for (const exercise of exercises) {
    const exerciseStartMs = sessionMs(exercise.startedAt);
    const exerciseEndMs = sessionMs(exercise.completedAt);
    const ratio = overlapRatioForWindows(
      startMs,
      endMs,
      exerciseStartMs,
      exerciseEndMs
    );

    if (ratio < MIN_OVERLAP_RATIO) continue;

    const candidate: ExerciseMatchCandidate = {
      exercise,
      overlapRatio: ratio,
      confidence: confidenceFromOverlap(ratio),
    };

    if (!best) {
      best = candidate;
      continue;
    }

    const ratioDiff = candidate.overlapRatio - best.overlapRatio;
    if (ratioDiff > 0.05) {
      best = candidate;
      continue;
    }

    if (Math.abs(ratioDiff) <= 0.05) {
      const candidateLift = liftTypeScore(candidate.exercise.exerciseType);
      const bestLift = liftTypeScore(best.exercise.exerciseType);
      if (candidateLift > bestLift) {
        best = candidate;
      }
    }
  }

  return best;
}

export function matchSessionsToExercises(
  sessions: WorkoutSessionWindow[],
  exercises: ExerciseSessionSummary[]
): Map<string, ExerciseMatchCandidate> {
  const usedExerciseIds = new Set<string>();
  const matches = new Map<string, ExerciseMatchCandidate>();

  const orderedSessions = [...sessions].sort(
    (a, b) => sessionMs(b.completedAt) - sessionMs(a.completedAt)
  );

  for (const session of orderedSessions) {
    const available = exercises.filter(
      (exercise) => !usedExerciseIds.has(exercise.externalId)
    );
    const match = findBestExerciseMatch(session, available);
    if (!match) continue;

    matches.set(session.id, match);
    usedExerciseIds.add(match.exercise.externalId);
  }

  return matches;
}
