import type { LocalExerciseSet, LocalWorkoutSession } from "@forgefit/offline-sync";
import { getSetsForSession, listSessionsForUser } from "@forgefit/offline-sync";
import type { WorkoutSessionRecord, WorkoutSetRecord } from "./sessions";

function mapLocalSets(sets: LocalExerciseSet[]): WorkoutSetRecord[] {
  return sets.map((set) => ({
    exerciseId: set.exerciseId,
    exerciseName: set.exerciseName,
    setNumber: set.setNumber,
    reps: set.reps,
    durationMs: set.durationMs,
    weightKg: set.weightKg,
    rir: set.rir,
    completed: set.completed,
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
    sessionName: session.sessionName,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt ?? null,
    sets: mapLocalSets(sets),
    pendingSync: !session.synced,
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
