import type { LocalExerciseSet, LocalWorkoutSession } from "@forgefit/offline-sync";
import { getSetsForSession, listSessionsForUser } from "@forgefit/offline-sync";
import type { WorkoutSessionRecord, WorkoutSetRecord, WorkoutExerciseSwap } from "./sessions";
import type { WorkoutSessionSource } from "./session-source";

function mapLocalSets(sets: LocalExerciseSet[]): WorkoutSetRecord[] {
  return sets.map((set) => ({
    exerciseId: set.exerciseId,
    exerciseName: set.exerciseName,
    plannedExerciseId: set.plannedExerciseId,
    setNumber: set.setNumber,
    reps: set.reps,
    durationMs: set.durationMs,
    weightKg: set.weightKg,
    rir: set.rir,
    completed: set.completed,
  }));
}

function collectExerciseSwaps(
  session: LocalWorkoutSession
): WorkoutExerciseSwap[] {
  return session.exercises
    .filter(
      (exercise) =>
        exercise.plannedExerciseId &&
        exercise.plannedExerciseId !== exercise.exerciseId
    )
    .map((exercise) => ({
      plannedExerciseName:
        exercise.plannedExerciseName ?? exercise.plannedExerciseId!,
      actualExerciseName: exercise.name,
    }));
}

function mapLocalSession(
  session: LocalWorkoutSession,
  sets: LocalExerciseSet[]
): WorkoutSessionRecord {
  return {
    id: session.clientId,
    clientId: session.clientId,
    dayIndex: session.dayIndex,
    sessionSource: session.sessionSource ?? "program",
    templateId: session.templateId,
    sessionName: session.sessionName,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt ?? null,
    sets: mapLocalSets(sets),
    swaps: collectExerciseSwaps(session),
    pendingSync: !session.synced,
    warmupBlock: session.warmupBlock,
    warmupStatus: session.warmupStatus,
    warmupDurationMs: session.warmupDurationMs,
    warmupCompletedAt: session.warmupCompletedAt ?? null,
    recoveryBlock: session.recoveryBlock,
    recoveryStatus: session.recoveryStatus,
    recoveryDurationMs: session.recoveryDurationMs,
    recoveryCompletedAt: session.recoveryCompletedAt ?? null,
  };
}

export async function loadLocalSessionRecords(
  userId: string
): Promise<WorkoutSessionRecord[]> {
  const sessions = await listSessionsForUser(userId);
  return Promise.all(
    sessions.map(async (session) => {
      const sets = await getSetsForSession(session.clientId);
      return mapLocalSession(session, sets);
    })
  );
}
