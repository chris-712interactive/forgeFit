import { estimateE1rmFromSet } from "@/lib/progression/one-rep-max";
import { resolveOneRepMaxLabel } from "@/lib/progression/one-rep-max-lifts";

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

/** True single at failure — e1RM equals the load lifted (not an estimate). */
export function isActualOneRepMaxPr(
  pr: Pick<DetectedWorkoutPr, "reps" | "weightKg" | "e1rmKg">
): boolean {
  return pr.reps === 1 && Math.abs(pr.e1rmKg - pr.weightKg) < 0.05;
}

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
    label: resolveOneRepMaxLabel(exerciseId, exerciseName),
    weightKg,
    reps,
    e1rmKg: Math.round(e1rmKg * 10) / 10,
    previousE1rmKg: Math.round(priorBestE1rmKg * 10) / 10,
  };
}
