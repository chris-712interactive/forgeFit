import { exerciseTracksWeight } from "@forgefit/exercise-db";
import {
  ONE_REP_MAX_LIFTS,
  resolveOneRepMaxLabel,
} from "@/lib/progression/one-rep-max-lifts";
import { estimateE1rmFromSet } from "@/lib/progression/one-rep-max";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import type { LiftStrengthSeries, StrengthDataPoint } from "./types";

function sessionDate(session: WorkoutSessionRecord): string {
  return (session.completedAt ?? session.startedAt).slice(0, 10);
}

function bestE1rmInSession(
  session: WorkoutSessionRecord,
  exerciseId: string
): number | null {
  let best: number | null = null;

  for (const set of session.sets) {
    if (
      !set.completed ||
      set.exerciseId !== exerciseId ||
      set.weightKg == null ||
      set.weightKg <= 0 ||
      set.reps == null ||
      set.reps <= 0
    ) {
      continue;
    }

    const estimate = estimateE1rmFromSet(set.weightKg, set.reps, set.rir);
    if (best == null || estimate > best) {
      best = estimate;
    }
  }

  return best;
}

function buildSeriesForExercise(
  exerciseId: string,
  label: string,
  completed: WorkoutSessionRecord[]
): LiftStrengthSeries | null {
  const points: StrengthDataPoint[] = [];

  for (const session of completed) {
    const e1rm = bestE1rmInSession(session, exerciseId);
    if (e1rm == null) continue;

    const date = sessionDate(session);
    const last = points[points.length - 1];
    if (last?.date === date) {
      last.e1rmKg = Math.max(last.e1rmKg, Math.round(e1rm * 10) / 10);
    } else {
      points.push({
        date,
        e1rmKg: Math.round(e1rm * 10) / 10,
      });
    }
  }

  if (points.length === 0) return null;

  return {
    exerciseId,
    label,
    points,
  };
}

export function buildStrengthSeries(
  sessions: WorkoutSessionRecord[],
  cutoffIso: string | null
): LiftStrengthSeries[] {
  const completed = sessions
    .filter((session) => session.status === "completed")
    .filter((session) =>
      cutoffIso ? sessionDate(session) >= cutoffIso : true
    )
    .sort((a, b) => sessionDate(a).localeCompare(sessionDate(b)));

  const exerciseIds = new Set<string>(
    ONE_REP_MAX_LIFTS.map((lift) => lift.exerciseId)
  );

  for (const session of completed) {
    for (const set of session.sets) {
      if (
        set.completed &&
        exerciseTracksWeight(set.exerciseId) &&
        set.weightKg != null &&
        set.weightKg > 0 &&
        set.reps != null &&
        set.reps > 0
      ) {
        exerciseIds.add(set.exerciseId);
      }
    }
  }

  const featuredIdList = ONE_REP_MAX_LIFTS.map((lift) => lift.exerciseId);
  const featuredIdSet = new Set<string>(featuredIdList);
  const orderedIds = [
    ...featuredIdList.filter((id) => exerciseIds.has(id)),
    ...[...exerciseIds].filter((id) => !featuredIdSet.has(id)).sort(),
  ];

  return orderedIds
    .map((exerciseId) =>
      buildSeriesForExercise(
        exerciseId,
        resolveOneRepMaxLabel(exerciseId),
        completed
      )
    )
    .filter((series): series is LiftStrengthSeries => series != null);
}

export function isTrackedLift(exerciseId: string): boolean {
  return exerciseTracksWeight(exerciseId);
}
