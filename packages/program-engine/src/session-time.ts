import type { PlannedExercise, WorkoutSession } from "./types";

export function estimateExerciseMinutes(exercises: PlannedExercise[]): number {
  return exercises.reduce(
    (acc, ex) => acc + ex.sets * (ex.restSeconds / 60 + 0.5),
    0
  );
}

export function estimateMainWorkMinutes(exercises: PlannedExercise[]): number {
  return estimateExerciseMinutes(exercises) + exercises.length * 0.75;
}

export function sessionWarmupMinutes(session: WorkoutSession): number {
  return session.warmupBlock?.durationMinutes ?? 0;
}

export function sessionRecoveryMinutes(session: WorkoutSession): number {
  return session.recoveryBlock?.durationMinutes ?? 0;
}

export function sessionMainWorkMinutes(session: WorkoutSession): number {
  const warmupMins = sessionWarmupMinutes(session);
  const recoveryMins = sessionRecoveryMinutes(session);
  return Math.max(
    1,
    session.estimatedMinutes - warmupMins - recoveryMins
  );
}

export function sessionActiveMinutes(session: WorkoutSession): number {
  const warmupMins = sessionWarmupMinutes(session);
  const recoveryMins = sessionRecoveryMinutes(session);
  const mainMins = sessionMainWorkMinutes(session);
  return mainMins + warmupMins + recoveryMins * 0.3;
}

export function sessionWorkingSets(session: WorkoutSession): number {
  return session.exercises
    .filter((exercise) => exercise.primaryMuscles[0] !== "cardio")
    .reduce((sum, exercise) => sum + exercise.sets, 0);
}
