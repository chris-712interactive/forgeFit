import { ONE_REP_MAX_LIFTS } from "@/lib/progression/one-rep-max-lifts";
import { estimateE1rmFromSet } from "@/lib/progression/one-rep-max";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import type { PrRecord } from "./types";
import { isTrackedLift } from "./strength";

const LIFT_LABELS = new Map(
  ONE_REP_MAX_LIFTS.map((lift) => [lift.exerciseId, lift.label])
);

export function buildPrHistory(
  sessions: WorkoutSessionRecord[],
  cutoffIso: string | null,
  limit = 20
): PrRecord[] {
  const completed = sessions
    .filter((session) => session.status === "completed")
    .filter((session) => {
      const date = (session.completedAt ?? session.startedAt).slice(0, 10);
      return cutoffIso ? date >= cutoffIso : true;
    })
    .sort((a, b) =>
      (a.completedAt ?? a.startedAt).localeCompare(b.completedAt ?? b.startedAt)
    );

  const bestByExercise = new Map<string, number>();
  const records: PrRecord[] = [];

  for (const session of completed) {
    const date = (session.completedAt ?? session.startedAt).slice(0, 10);

    for (const set of session.sets) {
      if (
        !set.completed ||
        !isTrackedLift(set.exerciseId) ||
        set.weightKg == null ||
        set.weightKg <= 0 ||
        set.reps == null ||
        set.reps <= 0
      ) {
        continue;
      }

      const e1rm = estimateE1rmFromSet(set.weightKg, set.reps, set.rir);
      const previous = bestByExercise.get(set.exerciseId) ?? 0;

      if (e1rm > previous + 0.25) {
        bestByExercise.set(set.exerciseId, e1rm);
        records.push({
          exerciseId: set.exerciseId,
          exerciseName: set.exerciseName,
          label:
            (LIFT_LABELS as Map<string, string>).get(set.exerciseId) ??
            set.exerciseName,
          date,
          weightKg: set.weightKg,
          reps: set.reps,
          e1rmKg: Math.round(e1rm * 10) / 10,
        });
      }
    }
  }

  return records.slice(-limit).reverse();
}
