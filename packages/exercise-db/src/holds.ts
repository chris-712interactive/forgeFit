import { EXERCISES } from "./exercises";

export type HoldExperience = "beginner" | "intermediate" | "advanced";
export type TimedPrescriptionUnit = "seconds" | "minutes";

const DURATION_HOLD_EXERCISE_IDS = new Set(["plank"]);

const HOLD_DURATION_BY_LEVEL: Record<HoldExperience, string> = {
  beginner: "30-45 sec",
  intermediate: "45-60 sec",
  advanced: "60-90 sec",
};

function exerciseById(exerciseId: string) {
  return EXERCISES.find((exercise) => exercise.id === exerciseId);
}

export function isTimedCardioExercise(exerciseId: string): boolean {
  return exerciseById(exerciseId)?.movementPattern === "cardio";
}

export function isDurationHoldExercise(exerciseId: string): boolean {
  return DURATION_HOLD_EXERCISE_IDS.has(exerciseId);
}

export function isTimedExercise(exerciseId: string): boolean {
  return isDurationHoldExercise(exerciseId) || isTimedCardioExercise(exerciseId);
}

export function timedPrescriptionUnit(
  exerciseId: string
): TimedPrescriptionUnit {
  return isTimedCardioExercise(exerciseId) ? "minutes" : "seconds";
}

export function parseTimedTargetValue(prescription: string): number {
  const matches = prescription.match(/\d+/g);
  if (!matches?.length) return 0;
  return Math.max(...matches.map(Number));
}

export function holdDurationPrescription(
  exerciseId: string,
  experience: HoldExperience
): string | undefined {
  if (!isDurationHoldExercise(exerciseId)) return undefined;
  return HOLD_DURATION_BY_LEVEL[experience];
}

/** Use program text when already time-based; otherwise map holds to duration. */
export function resolveHoldPrescription(
  exerciseId: string,
  prescribedReps: string,
  experience: HoldExperience = "beginner"
): string {
  if (!isDurationHoldExercise(exerciseId)) return prescribedReps;
  if (/sec|min/i.test(prescribedReps)) return prescribedReps;
  return holdDurationPrescription(exerciseId, experience) ?? "30-45 sec";
}

export function resolveTimedPrescription(
  exerciseId: string,
  prescribedReps: string,
  experience: HoldExperience = "beginner"
): string {
  if (isDurationHoldExercise(exerciseId)) {
    return resolveHoldPrescription(exerciseId, prescribedReps, experience);
  }
  if (isTimedCardioExercise(exerciseId)) {
    if (/sec|min/i.test(prescribedReps)) return prescribedReps;
    return "15-25 min";
  }
  return prescribedReps;
}

export function timedTargetSeconds(
  exerciseId: string,
  prescription: string
): number {
  const value = parseTimedTargetValue(prescription);
  return timedPrescriptionUnit(exerciseId) === "minutes" ? value * 60 : value;
}

export function timedLogValueFromTimer(
  exerciseId: string,
  timerSeconds: number
): number {
  return timedPrescriptionUnit(exerciseId) === "minutes"
    ? Math.round(timerSeconds / 60)
    : timerSeconds;
}
