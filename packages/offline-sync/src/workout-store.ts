import { getOfflineDb } from "./db";
import type { RecoveryBlock, WarmupBlock, ConditioningBlock } from "@forgefit/program-engine";
import type {
  ExerciseSnapshot,
  LocalExerciseSet,
  LocalWorkoutSession,
  RecoveryStatus,
  WarmupStatus,
  ConditioningStatus,
  WorkoutStatus,
  SubstitutionReason,
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

export interface SetPrefill {
  weightKg?: number;
  reps?: number;
  durationMs?: number;
}

export async function startWorkoutSession(input: {
  userId: string;
  programId?: string;
  sessionName: string;
  dayIndex: number;
  exercises: ExerciseSnapshot[];
  warmupBlock?: WarmupBlock;
  recoveryBlock?: RecoveryBlock;
  conditioningBlock?: ConditioningBlock;
  /** Prefill logged targets for the first working set per exercise */
  setPrefills?: Record<string, SetPrefill>;
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
    warmupBlock: input.warmupBlock,
    warmupStatus: input.warmupBlock ? "pending" : undefined,
    recoveryBlock: input.recoveryBlock,
    recoveryStatus: input.recoveryBlock ? "pending" : undefined,
    conditioningBlock: input.conditioningBlock,
    conditioningStatus: input.conditioningBlock ? "pending" : undefined,
    conditioningRoundsCompleted: 0,
  };

  const sets: LocalExerciseSet[] = [];
  for (const exercise of input.exercises) {
    const totalSets = exercise.sets + (exercise.extraSets ?? 0);
    const prefill = input.setPrefills?.[exercise.exerciseId];

    for (let setNumber = 1; setNumber <= totalSets; setNumber++) {
      sets.push({
        clientId: crypto.randomUUID(),
        sessionClientId: clientId,
        userId: input.userId,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
        setNumber,
        weightKg: prefill?.weightKg,
        reps: prefill?.reps,
        durationMs: prefill?.durationMs,
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

export async function appendExerciseSet(input: {
  sessionClientId: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  prefill?: Pick<LocalExerciseSet, "weightKg" | "reps" | "durationMs">;
}): Promise<LocalExerciseSet | undefined> {
  const db = getOfflineDb();
  const session = await db.workoutSessions.get(input.sessionClientId);
  if (!session || session.status !== "in_progress") return undefined;

  const existingSets = await db.exerciseSets
    .where("sessionClientId")
    .equals(input.sessionClientId)
    .filter((set) => set.exerciseId === input.exerciseId)
    .toArray();

  const maxSetNumber = existingSets.reduce(
    (max, set) => Math.max(max, set.setNumber),
    0
  );

  const timestamp = nowIso();
  const created: LocalExerciseSet = {
    clientId: crypto.randomUUID(),
    sessionClientId: input.sessionClientId,
    userId: input.userId,
    exerciseId: input.exerciseId,
    exerciseName: input.exerciseName,
    setNumber: maxSetNumber + 1,
    weightKg: input.prefill?.weightKg,
    reps: input.prefill?.reps,
    durationMs: input.prefill?.durationMs,
    completed: false,
    updatedAt: timestamp,
    synced: false,
  };

  await db.transaction("rw", db.workoutSessions, db.exerciseSets, async () => {
    await db.exerciseSets.add(created);
    await db.workoutSessions.update(input.sessionClientId, {
      updatedAt: timestamp,
      synced: false,
    });
  });

  return created;
}

export async function swapExerciseInSession(input: {
  sessionClientId: string;
  exerciseIndex: number;
  newExerciseId: string;
  newExerciseName: string;
  reason: SubstitutionReason;
}): Promise<LocalWorkoutSession | undefined> {
  const db = getOfflineDb();
  const session = await db.workoutSessions.get(input.sessionClientId);
  if (!session || session.status !== "in_progress") return undefined;

  const current = session.exercises[input.exerciseIndex];
  if (!current) return undefined;

  const previousExerciseId = current.exerciseId;
  const plannedExerciseId = current.plannedExerciseId ?? current.exerciseId;
  const plannedExerciseName = current.plannedExerciseName ?? current.name;
  const timestamp = nowIso();

  const updatedExercise: ExerciseSnapshot = {
    ...current,
    exerciseId: input.newExerciseId,
    name: input.newExerciseName,
    plannedExerciseId,
    plannedExerciseName,
    substitutedAt: timestamp,
    substitutionReason: input.reason,
  };

  const exercises = session.exercises.map((exercise, index) =>
    index === input.exerciseIndex ? updatedExercise : exercise
  );

  const sets = await db.exerciseSets
    .where("sessionClientId")
    .equals(input.sessionClientId)
    .filter(
      (set) => set.exerciseId === previousExerciseId && !set.completed
    )
    .toArray();

  const lastCompletedWeight = (
    await db.exerciseSets
      .where("sessionClientId")
      .equals(input.sessionClientId)
      .filter(
        (set) => set.exerciseId === previousExerciseId && set.completed
      )
      .toArray()
  )
    .sort((a, b) => b.setNumber - a.setNumber)
    .find((set) => set.weightKg != null)?.weightKg;

  const updatedSession: LocalWorkoutSession = {
    ...session,
    exercises,
    updatedAt: timestamp,
    synced: false,
  };

  await db.transaction("rw", db.workoutSessions, db.exerciseSets, async () => {
    await db.workoutSessions.put(updatedSession);
    for (const set of sets) {
      await db.exerciseSets.put({
        ...set,
        exerciseId: input.newExerciseId,
        exerciseName: input.newExerciseName,
        plannedExerciseId,
        substitutionReason: input.reason,
        weightKg: set.weightKg ?? lastCompletedWeight,
        updatedAt: timestamp,
        synced: false,
      });
    }
  });

  return updatedSession;
}

export async function updateSet(
  clientId: string,
  patch: Partial<
    Pick<
      LocalExerciseSet,
      | "reps"
      | "durationMs"
      | "weightKg"
      | "rir"
      | "completed"
      | "completedAt"
    >
  >
): Promise<LocalExerciseSet | undefined> {
  const db = getOfflineDb();
  const existing = await db.exerciseSets.get(clientId);
  if (!existing) return undefined;

  const sanitizedPatch = { ...patch };
  if (sanitizedPatch.reps != null && !Number.isFinite(sanitizedPatch.reps)) {
    sanitizedPatch.reps = undefined;
  }
  if (sanitizedPatch.weightKg != null && !Number.isFinite(sanitizedPatch.weightKg)) {
    sanitizedPatch.weightKg = undefined;
  }

  const updated: LocalExerciseSet = {
    ...existing,
    ...sanitizedPatch,
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

export async function updateWorkoutWarmup(
  clientId: string,
  input: {
    status: Extract<WarmupStatus, "completed" | "skipped">;
    durationMs?: number;
  }
): Promise<LocalWorkoutSession | undefined> {
  const db = getOfflineDb();
  const existing = await db.workoutSessions.get(clientId);
  if (!existing) return undefined;

  const timestamp = nowIso();
  const updated: LocalWorkoutSession = {
    ...existing,
    warmupStatus: input.status,
    warmupDurationMs:
      input.status === "completed" ? input.durationMs : undefined,
    warmupCompletedAt: timestamp,
    updatedAt: timestamp,
    synced: false,
  };

  await db.workoutSessions.put(updated);
  return updated;
}

export async function updateWorkoutRecovery(
  clientId: string,
  input: {
    status: Extract<RecoveryStatus, "completed" | "skipped">;
    durationMs?: number;
  }
): Promise<LocalWorkoutSession | undefined> {
  const db = getOfflineDb();
  const existing = await db.workoutSessions.get(clientId);
  if (!existing) return undefined;

  const timestamp = nowIso();
  const updated: LocalWorkoutSession = {
    ...existing,
    recoveryStatus: input.status,
    recoveryDurationMs:
      input.status === "completed" ? input.durationMs : undefined,
    recoveryCompletedAt: timestamp,
    updatedAt: timestamp,
    synced: false,
  };

  await db.workoutSessions.put(updated);
  return updated;
}

export async function updateWorkoutConditioning(
  clientId: string,
  input: {
    status?: Extract<ConditioningStatus, "completed" | "skipped">;
    roundsCompleted?: number;
  }
): Promise<LocalWorkoutSession | undefined> {
  const db = getOfflineDb();
  const existing = await db.workoutSessions.get(clientId);
  if (!existing) return undefined;

  const timestamp = nowIso();
  const updated: LocalWorkoutSession = {
    ...existing,
    conditioningStatus: input.status ?? existing.conditioningStatus ?? "pending",
    conditioningRoundsCompleted:
      input.roundsCompleted ?? existing.conditioningRoundsCompleted ?? 0,
    updatedAt: timestamp,
    synced: false,
  };

  await db.workoutSessions.put(updated);
  return updated;
}

export async function cancelWorkoutSessionIfPresent(
  clientId: string
): Promise<boolean> {
  const db = getOfflineDb();
  const existing = await db.workoutSessions.get(clientId);
  if (!existing) return false;
  await completeWorkoutSession(clientId, "cancelled");
  return true;
}

export async function cancelWorkoutSession(clientId: string): Promise<void> {
  const cancelled = await cancelWorkoutSessionIfPresent(clientId);
  if (!cancelled) {
    throw new Error("Workout session not found on this device.");
  }
}

export async function cancelInProgressSessionsForDay(
  userId: string,
  dayIndex: number
): Promise<void> {
  const inProgress = await getInProgressSessions(userId);
  await Promise.all(
    inProgress
      .filter((session) => session.dayIndex === dayIndex)
      .map((session) => cancelWorkoutSessionIfPresent(session.clientId))
  );
}

export async function completeWorkoutSession(
  clientId: string,
  status: Extract<WorkoutStatus, "completed" | "cancelled"> = "completed"
): Promise<void> {
  const db = getOfflineDb();
  const existing = await db.workoutSessions.get(clientId);
  if (!existing) {
    throw new Error("Workout session not found on this device.");
  }

  const timestamp = nowIso();
  const sets = await db.exerciseSets
    .where("sessionClientId")
    .equals(clientId)
    .toArray();

  await db.transaction("rw", db.workoutSessions, db.exerciseSets, async () => {
    const updated = await db.workoutSessions.update(clientId, {
      status,
      completedAt: timestamp,
      updatedAt: timestamp,
      synced: false,
    });
    if (updated === 0) {
      throw new Error("Could not update workout session.");
    }
    for (const set of sets) {
      await db.exerciseSets.update(set.clientId, {
        updatedAt: timestamp,
        synced: false,
      });
    }
  });

  const saved = await db.workoutSessions.get(clientId);
  if (!saved || saved.status !== status) {
    throw new Error("Workout completion did not save locally.");
  }
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
