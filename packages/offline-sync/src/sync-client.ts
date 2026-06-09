import { collectUnsyncedPayload, markSynced } from "./workout-store";
import type { SyncRequestBody, SyncResponseBody } from "./types";

export async function syncWorkoutData(userId: string): Promise<SyncResponseBody | null> {
  if (!navigator.onLine) return null;

  const { sessions, sets } = await collectUnsyncedPayload(userId);
  if (sessions.length === 0 && sets.length === 0) {
    return { syncedSessions: 0, syncedSets: 0 };
  }

  const body: SyncRequestBody = {
    sessions: sessions.map((s) => ({
      clientId: s.clientId,
      programId: s.programId,
      sessionName: s.sessionName,
      dayIndex: s.dayIndex,
      status: s.status,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      updatedAt: s.updatedAt,
    })),
    sets: sets.map((s) => ({
      clientId: s.clientId,
      sessionClientId: s.sessionClientId,
      exerciseId: s.exerciseId,
      exerciseName: s.exerciseName,
      setNumber: s.setNumber,
      reps: s.reps,
      weightKg: s.weightKg,
      rir: s.rir,
      completed: s.completed,
      completedAt: s.completedAt,
      updatedAt: s.updatedAt,
    })),
  };

  const response = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  const result = (await response.json()) as SyncResponseBody;
  await markSynced(
    sessions.map((s) => s.clientId),
    sets.map((s) => s.clientId)
  );
  return result;
}
