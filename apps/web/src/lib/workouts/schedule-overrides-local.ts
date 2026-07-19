"use client";

import {
  cacheScheduleOverridesFromServer,
  listScheduleOverridesForUser,
  replaceLocalScheduleOverrides,
  type LocalScheduleOverride,
} from "@forgefit/offline-sync";
import type { WorkoutScheduleOverride } from "@/lib/workouts/schedule-overrides";
import { FEATURE_TEMPORARILY_UNAVAILABLE } from "@/lib/ui/member-errors";

export function localToScheduleOverride(
  row: LocalScheduleOverride
): WorkoutScheduleOverride {
  return {
    weekStartIso: row.weekStartIso,
    dayIndex: row.dayIndex,
    adjustedDateIso: row.adjustedDateIso,
  };
}

export async function loadLocalScheduleOverrides(
  userId: string
): Promise<WorkoutScheduleOverride[]> {
  const rows = await listScheduleOverridesForUser(userId);
  return rows.map(localToScheduleOverride);
}

export async function persistLocalScheduleOverrides(input: {
  userId: string;
  programId?: string;
  overrides: WorkoutScheduleOverride[];
}): Promise<WorkoutScheduleOverride[]> {
  await replaceLocalScheduleOverrides({
    userId: input.userId,
    programId: input.programId,
    overrides: input.overrides,
  });
  return loadLocalScheduleOverrides(input.userId);
}

export async function syncScheduleOverridesWithServer(input: {
  userId: string;
  programId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!navigator.onLine) {
    return { ok: false, error: "Offline" };
  }

  const localRows = await listScheduleOverridesForUser(input.userId);
  const unsynced = localRows.filter((row) => !row.synced);

  let serverOverrides: Array<{
    weekStartIso: string;
    dayIndex: number;
    adjustedDateIso: string;
    programId?: string;
    updatedAt: string;
  }> = [];
  let tableReady = true;

  try {
    const response = await fetch("/api/workout-schedule");
    if (!response.ok) {
      return { ok: false, error: "Could not load schedule overrides." };
    }
    const body = (await response.json()) as {
      overrides?: typeof serverOverrides;
      tableReady?: boolean;
    };
    serverOverrides = body.overrides ?? [];
    tableReady = body.tableReady ?? true;
  } catch {
    return { ok: false, error: "Could not load schedule overrides." };
  }

  if (!tableReady) {
    return {
      ok: false,
      error: FEATURE_TEMPORARILY_UNAVAILABLE,
    };
  }

  if (unsynced.length > 0) {
    const payload = {
      programId: input.programId,
      overrides: localRows.map((row) => ({
        weekStartIso: row.weekStartIso,
        dayIndex: row.dayIndex,
        adjustedDateIso: row.adjustedDateIso,
        updatedAt: row.updatedAt,
      })),
      deleted: [] as Array<{ weekStartIso: string; dayIndex: number }>,
    };

    const weekStarts = [...new Set(localRows.map((row) => row.weekStartIso))];
    for (const weekStartIso of weekStarts) {
      const localWeek = new Set(
        localRows
          .filter((row) => row.weekStartIso === weekStartIso)
          .map((row) => row.dayIndex)
      );
      for (const row of serverOverrides) {
        if (
          row.weekStartIso === weekStartIso &&
          !localWeek.has(row.dayIndex)
        ) {
          payload.deleted.push({
            weekStartIso: row.weekStartIso,
            dayIndex: row.dayIndex,
          });
        }
      }
    }

    const response = await fetch("/api/workout-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      return { ok: false, error: body.error ?? "Schedule sync failed." };
    }

    await cacheScheduleOverridesFromServer(
      input.userId,
      localRows.map((row) => ({
        weekStartIso: row.weekStartIso,
        dayIndex: row.dayIndex,
        adjustedDateIso: row.adjustedDateIso,
        programId: row.programId,
        updatedAt: row.updatedAt,
      }))
    );
    return { ok: true };
  }

  await cacheScheduleOverridesFromServer(input.userId, serverOverrides);
  return { ok: true };
}

export function mergeScheduleOverrideLists(
  local: WorkoutScheduleOverride[],
  server: WorkoutScheduleOverride[]
): WorkoutScheduleOverride[] {
  const map = new Map<string, WorkoutScheduleOverride>();
  for (const entry of server) {
    map.set(`${entry.weekStartIso}:${entry.dayIndex}`, entry);
  }
  for (const entry of local) {
    map.set(`${entry.weekStartIso}:${entry.dayIndex}`, entry);
  }
  return [...map.values()];
}
