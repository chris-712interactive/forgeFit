import { collectUnsyncedPayload, markSynced } from "./workout-store";
import type { SyncRequestBody, SyncResponseBody } from "./types";

export interface SyncResult {
  ok: true;
  syncedSessions: number;
  syncedSets: number;
}

export interface SyncError {
  ok: false;
  message: string;
  status?: number;
}

export type SyncOutcome = SyncResult | SyncError | null;

export async function getPendingSyncCount(userId: string): Promise<number> {
  const { sessions, sets } = await collectUnsyncedPayload(userId);
  return sessions.length + sets.length;
}

function finiteOrUndefined(value: number | undefined): number | undefined {
  return value != null && Number.isFinite(value) ? value : undefined;
}

export async function syncWorkoutData(userId: string): Promise<SyncOutcome> {
  if (!navigator.onLine) return null;

  const { sessions, sets } = await collectUnsyncedPayload(userId);
  if (sessions.length === 0 && sets.length === 0) {
    return { ok: true, syncedSessions: 0, syncedSets: 0 };
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
      recoveryName: s.recoveryBlock?.name,
      recoveryEquipment: s.recoveryBlock?.equipment,
      recoveryPlannedMinutes: s.recoveryBlock?.durationMinutes,
      recoveryStatus:
        s.recoveryStatus === "completed" || s.recoveryStatus === "skipped"
          ? s.recoveryStatus
          : undefined,
      recoveryDurationMs: finiteOrUndefined(s.recoveryDurationMs),
      recoveryCompletedAt: s.recoveryCompletedAt,
    })),
    sets: sets.map((s) => ({
      clientId: s.clientId,
      sessionClientId: s.sessionClientId,
      exerciseId: s.exerciseId,
      exerciseName: s.exerciseName,
      setNumber: s.setNumber,
      reps: finiteOrUndefined(s.reps),
      durationMs: finiteOrUndefined(s.durationMs),
      weightKg: finiteOrUndefined(s.weightKg),
      rir: finiteOrUndefined(s.rir),
      completed: s.completed,
      completedAt: s.completedAt,
      updatedAt: s.updatedAt,
    })),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch("/api/sync", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, message: "Sync timed out. Try again when connection is stable." };
    }
    return { ok: false, message: "Could not reach server. Workout is saved on this device." };
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let message = `Sync failed (${response.status})`;
    try {
      const err = (await response.json()) as { error?: string };
      if (err.error) message = err.error;
    } catch {
      // ignore parse errors
    }
    return { ok: false, message, status: response.status };
  }

  const result = (await response.json()) as SyncResponseBody;
  await markSynced(
    sessions.map((s) => s.clientId),
    sets.map((s) => s.clientId)
  );
  return {
    ok: true,
    syncedSessions: result.syncedSessions,
    syncedSets: result.syncedSets,
  };
}
