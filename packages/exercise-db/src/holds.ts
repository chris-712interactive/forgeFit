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

export interface TimedDurationParts {
  minutes: number;
  seconds: number;
}

export function timedDurationPartsFromMs(durationMs: number): TimedDurationParts {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  };
}

export function timedMsFromParts(minutes: number, seconds: number): number {
  const clampedSeconds = Math.min(59, Math.max(0, Math.round(seconds)));
  const clampedMinutes = Math.max(0, Math.round(minutes));
  return (clampedMinutes * 60 + clampedSeconds) * 1000;
}

export function timedMsFromElapsedSeconds(elapsedSeconds: number): number {
  return Math.max(0, Math.round(elapsedSeconds)) * 1000;
}

/** Format stored ms using the smallest sensible units for the exercise type. */
export function formatTimedDurationFromMs(
  exerciseId: string,
  durationMs: number
): string {
  const parts = timedDurationPartsFromMs(durationMs);
  const unit = timedPrescriptionUnit(exerciseId);

  if (unit === "minutes") {
    if (parts.minutes === 0) return `${parts.seconds} sec`;
    if (parts.seconds === 0) return `${parts.minutes} min`;
    return `${parts.minutes} min ${parts.seconds} sec`;
  }

  const totalSeconds = Math.round(durationMs / 1000);
  return `${totalSeconds} sec`;
}

export function timedSetTotalMs(
  set: {
    reps?: number;
    durationMs?: number;
  },
  exerciseId?: string
): number | undefined {
  if (set.durationMs != null) return set.durationMs;
  if (set.reps == null) return undefined;
  if (exerciseId && isTimedCardioExercise(exerciseId)) {
    return set.reps * 60_000;
  }
  return set.reps * 1000;
}

export function timedSetFieldsFromElapsed(
  exerciseId: string,
  elapsedSeconds: number
): {
  durationMs: number;
  reps?: number;
} {
  const durationMs = timedMsFromElapsedSeconds(elapsedSeconds);
  const parts = timedDurationPartsFromMs(durationMs);
  return {
    durationMs,
    reps:
      timedPrescriptionUnit(exerciseId) === "minutes"
        ? parts.minutes
        : parts.seconds,
  };
}

/** @deprecated Use timedSetTotalMs */
export function timedSetTotalSeconds(
  set: { reps?: number; durationMs?: number },
  exerciseId?: string
): number | undefined {
  const ms = timedSetTotalMs(set, exerciseId);
  return ms != null ? Math.round(ms / 1000) : undefined;
}

/** @deprecated Use formatTimedDurationFromMs */
export function formatTimedDuration(
  duration: TimedDurationParts,
  unit: TimedPrescriptionUnit
): string {
  if (unit === "minutes") {
    if (duration.minutes === 0) return `${duration.seconds} sec`;
    if (duration.seconds === 0) return `${duration.minutes} min`;
    return `${duration.minutes} min ${duration.seconds} sec`;
  }
  return `${duration.seconds} sec`;
}

/** @deprecated Use timedDurationPartsFromMs */
export function timedDurationFromElapsed(elapsedSeconds: number): TimedDurationParts {
  return timedDurationPartsFromMs(timedMsFromElapsedSeconds(elapsedSeconds));
}

export function timedLogValueFromElapsed(
  exerciseId: string,
  elapsedSeconds: number
): number {
  return timedSetFieldsFromElapsed(exerciseId, elapsedSeconds).reps ?? 0;
}

export function timedLogValueFromTimer(
  exerciseId: string,
  timerSeconds: number
): number {
  return timedLogValueFromElapsed(exerciseId, timerSeconds);
}
