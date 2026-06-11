import { ONE_REP_MAX_LIFTS } from "@/lib/progression/one-rep-max-lifts";
import { estimateE1rmFromSet } from "@/lib/progression/one-rep-max";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import type { LiftStrengthSeries, StrengthDataPoint } from "./types";

const LIFT_IDS = new Set(ONE_REP_MAX_LIFTS.map((lift) => lift.exerciseId));
const LIFT_LABELS = new Map(
  ONE_REP_MAX_LIFTS.map((lift) => [lift.exerciseId, lift.label])
);

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

  return ONE_REP_MAX_LIFTS.map((lift) => {
    const points: StrengthDataPoint[] = [];

    for (const session of completed) {
      const e1rm = bestE1rmInSession(session, lift.exerciseId);
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

    return {
      exerciseId: lift.exerciseId,
      label: LIFT_LABELS.get(lift.exerciseId) ?? lift.label,
      points,
    };
  }).filter((series) => series.points.length > 0);
}

export function isTrackedLift(exerciseId: string): boolean {
  return LIFT_IDS.has(exerciseId as never);
}
