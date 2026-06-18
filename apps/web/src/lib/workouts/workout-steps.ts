import type { ExerciseSnapshot, LocalExerciseSet, LocalWorkoutSession } from "@forgefit/offline-sync";

export type WorkoutStep =
  | { kind: "overview" }
  | { kind: "warmup" }
  | { kind: "exercise"; exerciseIndex: number }
  | { kind: "recovery" }
  | { kind: "finish" };

export function buildWorkoutSteps(session: LocalWorkoutSession): WorkoutStep[] {
  const steps: WorkoutStep[] = [{ kind: "overview" }];

  if (session.warmupBlock) {
    steps.push({ kind: "warmup" });
  }

  session.exercises.forEach((_, exerciseIndex) => {
    steps.push({ kind: "exercise", exerciseIndex });
  });

  if (session.recoveryBlock) {
    steps.push({ kind: "recovery" });
  }

  steps.push({ kind: "finish" });
  return steps;
}

export function stepLabel(
  step: WorkoutStep,
  session: LocalWorkoutSession
): string {
  switch (step.kind) {
    case "overview":
      return "Equipment check";
    case "warmup":
      return "Warm-up";
    case "exercise":
      return session.exercises[step.exerciseIndex]?.name ?? "Exercise";
    case "recovery":
      return "Recovery";
    case "finish":
      return "Wrap up";
  }
}

export function initialStepIndex(
  steps: WorkoutStep[],
  session: LocalWorkoutSession,
  sets: LocalExerciseSet[]
): number {
  const hasProgress =
    session.warmupStatus === "completed" ||
    session.warmupStatus === "skipped" ||
    sets.some((set) => set.completed);

  if (!hasProgress) {
    const overviewIndex = steps.findIndex((step) => step.kind === "overview");
    if (overviewIndex >= 0) return overviewIndex;
  }

  if (
    session.warmupBlock &&
    (session.warmupStatus === "pending" || !session.warmupStatus)
  ) {
    const warmupIndex = steps.findIndex((step) => step.kind === "warmup");
    if (warmupIndex >= 0) return warmupIndex;
  }

  for (const step of steps) {
    if (step.kind !== "exercise") continue;
    const exercise = session.exercises[step.exerciseIndex];
    if (!exercise) continue;
    const exerciseSets = sets.filter(
      (set) => set.exerciseId === exercise.exerciseId
    );
    if (exerciseSets.length === 0 || exerciseSets.some((set) => !set.completed)) {
      return steps.indexOf(step);
    }
  }

  if (
    session.recoveryBlock &&
    (session.recoveryStatus === "pending" || !session.recoveryStatus)
  ) {
    const recoveryIndex = steps.findIndex((step) => step.kind === "recovery");
    if (recoveryIndex >= 0) return recoveryIndex;
  }

  return Math.max(0, steps.length - 1);
}

export function canAdvanceFromStep(
  step: WorkoutStep,
  session: LocalWorkoutSession
): boolean {
  switch (step.kind) {
    case "overview":
      return true;
    case "warmup":
      return (
        session.warmupStatus === "completed" ||
        session.warmupStatus === "skipped"
      );
    case "exercise":
      return true;
    case "recovery":
      return (
        session.recoveryStatus === "completed" ||
        session.recoveryStatus === "skipped"
      );
    case "finish":
      return true;
  }
}
