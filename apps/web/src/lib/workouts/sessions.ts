export interface WorkoutSetRecord {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps?: number;
  weightKg?: number;
  rir?: number;
  completed: boolean;
}

export interface WorkoutSessionRecord {
  id: string;
  clientId: string;
  dayIndex: number;
  sessionName: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  sets: WorkoutSetRecord[];
  pendingSync?: boolean;
}

export interface DayPlanStatus {
  dayIndex: number;
  inProgress: WorkoutSessionRecord | null;
  latestCompleted: WorkoutSessionRecord | null;
  priorCompleted: WorkoutSessionRecord[];
}

function completedSetCount(record: WorkoutSessionRecord): number {
  return record.sets.filter((s) => s.completed).length;
}

export function mergeSessionRecords(
  local: WorkoutSessionRecord[],
  server: WorkoutSessionRecord[]
): WorkoutSessionRecord[] {
  const serverByClientId = new Map(server.map((record) => [record.clientId, record]));
  const localByClientId = new Map(local.map((record) => [record.clientId, record]));
  const clientIds = new Set([
    ...serverByClientId.keys(),
    ...localByClientId.keys(),
  ]);

  const merged: WorkoutSessionRecord[] = [];

  for (const clientId of clientIds) {
    const serverRecord = serverByClientId.get(clientId);
    const localRecord = localByClientId.get(clientId);

    if (serverRecord && localRecord) {
      const preferLocalSets =
        completedSetCount(localRecord) > completedSetCount(serverRecord);
      const base = preferLocalSets ? localRecord : serverRecord;
      merged.push({
        ...base,
        sets: preferLocalSets ? localRecord.sets : serverRecord.sets,
        // Server has this session — it's on the account even if local synced flag is stale.
        pendingSync: false,
      });
      continue;
    }

    if (localRecord) {
      merged.push(localRecord);
      continue;
    }

    if (serverRecord) {
      merged.push({ ...serverRecord, pendingSync: false });
    }
  }

  return merged.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function buildDayStatusMap(
  sessions: WorkoutSessionRecord[]
): Map<number, DayPlanStatus> {
  const map = new Map<number, DayPlanStatus>();

  for (const session of sessions) {
    const entry = map.get(session.dayIndex) ?? {
      dayIndex: session.dayIndex,
      inProgress: null,
      latestCompleted: null,
      priorCompleted: [],
    };

    if (session.status === "in_progress") {
      if (
        !entry.inProgress ||
        session.startedAt.localeCompare(entry.inProgress.startedAt) > 0
      ) {
        entry.inProgress = session;
      }
    } else if (session.status === "completed") {
      if (
        !entry.latestCompleted ||
        (session.completedAt ?? session.startedAt).localeCompare(
          entry.latestCompleted.completedAt ?? entry.latestCompleted.startedAt
        ) > 0
      ) {
        if (entry.latestCompleted) {
          entry.priorCompleted.push(entry.latestCompleted);
        }
        entry.latestCompleted = session;
      } else {
        entry.priorCompleted.push(session);
      }
    }

    map.set(session.dayIndex, entry);
  }

  for (const entry of map.values()) {
    entry.priorCompleted.sort((a, b) =>
      (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt)
    );
  }

  return map;
}

export function getPriorSessionForComparison(
  dayStatus: DayPlanStatus | undefined,
  currentClientId: string
): WorkoutSessionRecord | null {
  if (!dayStatus) return null;
  return dayStatus.priorCompleted.find((s) => s.clientId !== currentClientId) ?? null;
}
