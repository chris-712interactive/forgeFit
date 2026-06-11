import type { ProgramPlan, WorkoutSession } from "./types";

export function isDeloadTrainingWeek(
  completedSessions: number,
  sessionsPerWeek: number,
  intervalWeeks = 6
): boolean {
  const perWeek = Math.max(1, sessionsPerWeek);
  const trainingWeeks = Math.floor(completedSessions / perWeek);
  return trainingWeeks >= intervalWeeks && trainingWeeks % intervalWeeks === 0;
}

function scaleSessionForDeload(
  session: WorkoutSession,
  reductionPct: number
): WorkoutSession {
  const volumeMult = 1 - reductionPct / 100;
  const deloadNote = `Deload week — use ~${reductionPct}% less load and keep reps easy.`;

  const exercises = session.exercises.map((exercise) => ({
    ...exercise,
    sets: Math.max(2, Math.round(exercise.sets * volumeMult)),
    notes: exercise.notes ? `${deloadNote} ${exercise.notes}` : deloadNote,
  }));

  const estimatedMinutes = Math.max(
    15,
    Math.round(session.estimatedMinutes * volumeMult)
  );

  return {
    ...session,
    name: session.name.startsWith("Deload")
      ? session.name
      : `Deload · ${session.name}`,
    exercises,
    estimatedMinutes,
  };
}

export function applyDeloadWeek(
  plan: ProgramPlan,
  reductionPct = 40
): ProgramPlan {
  const week = plan.week.map((session) =>
    scaleSessionForDeload(session, reductionPct)
  );

  return {
    ...plan,
    week,
    isDeloadWeek: true,
    summary: `${plan.summary} · deload week (${reductionPct}% volume reduction)`,
  };
}
