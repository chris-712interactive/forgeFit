import { estimateE1rmFromSet } from "@/lib/progression/one-rep-max";
import { ONE_REP_MAX_LIFTS } from "@/lib/progression/one-rep-max-lifts";

const LIFT_LABELS = new Map(
  ONE_REP_MAX_LIFTS.map((lift) => [lift.exerciseId, lift.label])
);

export interface DetectedWorkoutPr {
  exerciseId: string;
  exerciseName: string;
  label: string;
  weightKg: number;
  reps: number;
  e1rmKg: number;
  previousE1rmKg: number;
}

const PR_THRESHOLD_KG = 0.25;

export function detectSetPr(
  exerciseId: string,
  exerciseName: string,
  weightKg: number,
  reps: number,
  rir: number | undefined,
  priorBestE1rmKg: number
): DetectedWorkoutPr | null {
  if (weightKg <= 0 || reps <= 0) {
    return null;
  }

  const e1rmKg = estimateE1rmFromSet(weightKg, reps, rir);
  if (e1rmKg <= priorBestE1rmKg + PR_THRESHOLD_KG) {
    return null;
  }

  return {
    exerciseId,
    exerciseName,
    label:
      LIFT_LABELS.get(exerciseId as (typeof ONE_REP_MAX_LIFTS)[number]["exerciseId"]) ??
      exerciseName,
    weightKg,
    reps,
    e1rmKg: Math.round(e1rmKg * 10) / 10,
    previousE1rmKg: Math.round(priorBestE1rmKg * 10) / 10,
  };
}
