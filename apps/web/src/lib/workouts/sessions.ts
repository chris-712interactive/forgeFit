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

function sessionKey(record: WorkoutSessionRecord): string {
  return `${record.clientId}:${record.startedAt}`;
}

export function mergeSessionRecords(
  local: WorkoutSessionRecord[],
  server: WorkoutSessionRecord[]
): WorkoutSessionRecord[] {
  const byKey = new Map<string, WorkoutSessionRecord>();

  for (const record of server) {
    byKey.set(sessionKey(record), record);
  }

  for (const record of local) {
    const key = sessionKey(record);
    const existing = byKey.get(key);
    if (!existing || record.pendingSync) {
      byKey.set(key, record);
      continue;
    }
    const localCompleted = record.sets.filter((s) => s.completed).length;
    const existingCompleted = existing.sets.filter((s) => s.completed).length;
    if (localCompleted > existingCompleted) {
      byKey.set(key, record);
    }
  }

  return [...byKey.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
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
