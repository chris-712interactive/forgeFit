import {
  exerciseTracksWeight,
  isBodyweightOnlyExercise,
  isTimedExercise,
  timedSetTotalMs,
} from "@forgefit/exercise-db";
import type { WorkoutSessionRecord, WorkoutSetRecord } from "./sessions";

export interface ExerciseComparison {
  exerciseId: string;
  exerciseName: string;
  currentSets: WorkoutSetRecord[];
  priorSets: WorkoutSetRecord[];
  currentBest: { weightKg: number; reps: number } | null;
  priorBest: { weightKg: number; reps: number } | null;
  volumeDeltaKg: number | null;
  weightDeltaKg: number | null;
}

function isCompletedSet(
  set: WorkoutSetRecord,
  exerciseId: string
): boolean {
  if (!set.completed) return false;

  if (isTimedExercise(exerciseId)) {
    return timedSetTotalMs(set, exerciseId) != null;
  }

  if (set.reps == null) return false;

  if (exerciseTracksWeight(exerciseId)) {
    return set.weightKg != null;
  }

  return true;
}

function completedSets(
  sets: WorkoutSetRecord[],
  exerciseId: string
): WorkoutSetRecord[] {
  return sets.filter((set) => isCompletedSet(set, exerciseId));
}

function bestSet(
  sets: WorkoutSetRecord[],
  exerciseId: string
): { weightKg: number; reps: number } | null {
  const done = completedSets(sets, exerciseId);
  if (done.length === 0) return null;

  if (isBodyweightOnlyExercise(exerciseId)) {
    return done.reduce(
      (best, set) => {
        const reps = set.reps ?? 0;
        return reps > best.reps ? { weightKg: 0, reps } : best;
      },
      { weightKg: 0, reps: done[0].reps ?? 0 }
    );
  }

  return done.reduce(
    (best, set) => {
      const weight = set.weightKg ?? 0;
      const reps = set.reps ?? 0;
      if (weight > best.weightKg || (weight === best.weightKg && reps > best.reps)) {
        return { weightKg: weight, reps };
      }
      return best;
    },
    { weightKg: done[0].weightKg ?? 0, reps: done[0].reps ?? 0 }
  );
}

function volumeKg(sets: WorkoutSetRecord[], exerciseId: string): number {
  if (!exerciseTracksWeight(exerciseId)) return 0;

  return completedSets(sets, exerciseId).reduce(
    (sum, set) => sum + (set.weightKg ?? 0) * (set.reps ?? 0),
    0
  );
}

export function compareSessions(
  current: WorkoutSessionRecord,
  prior: WorkoutSessionRecord | null
): ExerciseComparison[] {
  const exerciseIds = new Set([
    ...current.sets.map((s) => s.exerciseId),
    ...(prior?.sets.map((s) => s.exerciseId) ?? []),
  ]);

  const currentByExercise = groupByExercise(current.sets);
  const priorByExercise = prior ? groupByExercise(prior.sets) : new Map();

  return [...exerciseIds].map((exerciseId) => {
    const currentSets = currentByExercise.get(exerciseId) ?? [];
    const priorSets = priorByExercise.get(exerciseId) ?? [];
    const currentBest = bestSet(currentSets, exerciseId);
    const priorBest = bestSet(priorSets, exerciseId);
    const currentVolume = volumeKg(currentSets, exerciseId);
    const priorVolume = volumeKg(priorSets, exerciseId);
    const tracksWeight = exerciseTracksWeight(exerciseId);

    return {
      exerciseId,
      exerciseName:
        currentSets[0]?.exerciseName ?? priorSets[0]?.exerciseName ?? exerciseId,
      currentSets,
      priorSets,
      currentBest,
      priorBest,
      volumeDeltaKg:
        prior && priorVolume > 0 && tracksWeight
          ? currentVolume - priorVolume
          : null,
      weightDeltaKg:
        tracksWeight && currentBest && priorBest
          ? currentBest.weightKg - priorBest.weightKg
          : null,
    };
  });
}

function groupByExercise(
  sets: WorkoutSetRecord[]
): Map<string, WorkoutSetRecord[]> {
  const map = new Map<string, WorkoutSetRecord[]>();
  for (const set of sets) {
    const group = map.get(set.exerciseId) ?? [];
    group.push(set);
    map.set(set.exerciseId, group);
  }
  for (const group of map.values()) {
    group.sort((a, b) => a.setNumber - b.setNumber);
  }
  return map;
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
