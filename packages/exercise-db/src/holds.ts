export type HoldExperience = "beginner" | "intermediate" | "advanced";

const DURATION_HOLD_EXERCISE_IDS = new Set(["plank"]);

const HOLD_DURATION_BY_LEVEL: Record<HoldExperience, string> = {
  beginner: "30-45 sec",
  intermediate: "45-60 sec",
  advanced: "60-90 sec",
};

export function isDurationHoldExercise(exerciseId: string): boolean {
  return DURATION_HOLD_EXERCISE_IDS.has(exerciseId);
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
