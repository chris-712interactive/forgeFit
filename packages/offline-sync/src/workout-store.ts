import { getOfflineDb } from "./db";
import type {
  ExerciseSnapshot,
  LocalExerciseSet,
  LocalWorkoutSession,
  WorkoutStatus,
} from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

export async function listSessionsForUser(
  userId: string
): Promise<LocalWorkoutSession[]> {
  const db = getOfflineDb();
  const sessions = await db.workoutSessions.where("userId").equals(userId).toArray();
  return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getInProgressSessions(
  userId: string
): Promise<LocalWorkoutSession[]> {
  const sessions = await listSessionsForUser(userId);
  return sessions.filter((s) => s.status === "in_progress");
}

export async function getSession(
  clientId: string
): Promise<LocalWorkoutSession | undefined> {
  const db = getOfflineDb();
  return db.workoutSessions.get(clientId);
}

export async function getSetsForSession(
  sessionClientId: string
): Promise<LocalExerciseSet[]> {
  const db = getOfflineDb();
  const sets = await db.exerciseSets
    .where("sessionClientId")
    .equals(sessionClientId)
    .toArray();
  return sets.sort(
    (a, b) =>
      a.exerciseId.localeCompare(b.exerciseId) || a.setNumber - b.setNumber
  );
}

export async function startWorkoutSession(input: {
  userId: string;
  programId?: string;
  sessionName: string;
  dayIndex: number;
  exercises: ExerciseSnapshot[];
}): Promise<string> {
  const db = getOfflineDb();
  const clientId = crypto.randomUUID();
  const timestamp = nowIso();

  const session: LocalWorkoutSession = {
    clientId,
    userId: input.userId,
    programId: input.programId,
    sessionName: input.sessionName,
    dayIndex: input.dayIndex,
    status: "in_progress",
    startedAt: timestamp,
    updatedAt: timestamp,
    synced: false,
    exercises: input.exercises,
  };

  const sets: LocalExerciseSet[] = [];
  for (const exercise of input.exercises) {
    for (let setNumber = 1; setNumber <= exercise.sets; setNumber++) {
      sets.push({
        clientId: crypto.randomUUID(),
        sessionClientId: clientId,
        userId: input.userId,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
        setNumber,
        completed: false,
        updatedAt: timestamp,
        synced: false,
      });
    }
  }

  await db.transaction("rw", db.workoutSessions, db.exerciseSets, async () => {
    await db.workoutSessions.add(session);
    await db.exerciseSets.bulkAdd(sets);
  });

  return clientId;
}

export async function updateSet(
  clientId: string,
  patch: Partial<
    Pick<LocalExerciseSet, "reps" | "weightKg" | "rir" | "completed" | "completedAt">
  >
): Promise<LocalExerciseSet | undefined> {
  const db = getOfflineDb();
  const existing = await db.exerciseSets.get(clientId);
  if (!existing) return undefined;

  const updated: LocalExerciseSet = {
    ...existing,
    ...patch,
    completedAt:
      patch.completed === true
        ? (patch.completedAt ?? nowIso())
        : patch.completed === false
          ? undefined
          : existing.completedAt,
    updatedAt: nowIso(),
    synced: false,
  };

  await db.exerciseSets.put(updated);
  await db.workoutSessions.update(existing.sessionClientId, {
    updatedAt: nowIso(),
    synced: false,
  });

  return updated;
}

export async function completeWorkoutSession(
  clientId: string,
  status: Extract<WorkoutStatus, "completed" | "cancelled"> = "completed"
): Promise<void> {
  const db = getOfflineDb();
  const timestamp = nowIso();
  await db.workoutSessions.update(clientId, {
    status,
    completedAt: timestamp,
    updatedAt: timestamp,
    synced: false,
  });
}

export async function collectUnsyncedPayload(userId: string): Promise<{
  sessions: LocalWorkoutSession[];
  sets: LocalExerciseSet[];
}> {
  const db = getOfflineDb();
  const sessions = await db.workoutSessions
    .where("userId")
    .equals(userId)
    .filter((s) => !s.synced)
    .toArray();
  const sets = await db.exerciseSets
    .where("userId")
    .equals(userId)
    .filter((s) => !s.synced)
    .toArray();
  return { sessions, sets };
}

export async function markSynced(
  sessionClientIds: string[],
  setClientIds: string[]
): Promise<void> {
  const db = getOfflineDb();
  await db.transaction("rw", db.workoutSessions, db.exerciseSets, async () => {
    for (const id of sessionClientIds) {
      await db.workoutSessions.update(id, { synced: true });
    }
    for (const id of setClientIds) {
      await db.exerciseSets.update(id, { synced: true });
    }
  });
}
