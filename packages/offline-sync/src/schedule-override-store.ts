import { getOfflineDb } from "./db";
import type { LocalScheduleOverride } from "./schedule-override-types";

function nowIso(): string {
  return new Date().toISOString();
}

function overrideKey(weekStartIso: string, dayIndex: number): string {
  return `${weekStartIso}:${dayIndex}`;
}

export async function listScheduleOverridesForUser(
  userId: string
): Promise<LocalScheduleOverride[]> {
  const db = getOfflineDb();
  const rows = await db.scheduleOverrides.where("userId").equals(userId).toArray();
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listUnsyncedScheduleOverrides(
  userId: string
): Promise<LocalScheduleOverride[]> {
  const rows = await listScheduleOverridesForUser(userId);
  return rows.filter((row) => !row.synced);
}

export async function upsertLocalScheduleOverride(input: {
  userId: string;
  programId?: string;
  weekStartIso: string;
  dayIndex: number;
  adjustedDateIso: string;
}): Promise<LocalScheduleOverride> {
  const db = getOfflineDb();
  const existing = await db.scheduleOverrides
    .where("[weekStartIso+dayIndex]")
    .equals([input.weekStartIso, input.dayIndex])
    .and((row) => row.userId === input.userId)
    .first();

  const timestamp = nowIso();
  const row: LocalScheduleOverride = {
    id: existing?.id ?? crypto.randomUUID(),
    userId: input.userId,
    programId: input.programId ?? existing?.programId,
    weekStartIso: input.weekStartIso,
    dayIndex: input.dayIndex,
    adjustedDateIso: input.adjustedDateIso,
    updatedAt: timestamp,
    synced: false,
  };

  await db.scheduleOverrides.put(row);
  return row;
}

export async function deleteLocalScheduleOverride(input: {
  userId: string;
  weekStartIso: string;
  dayIndex: number;
}): Promise<void> {
  const db = getOfflineDb();
  const existing = await db.scheduleOverrides
    .where("[weekStartIso+dayIndex]")
    .equals([input.weekStartIso, input.dayIndex])
    .and((row) => row.userId === input.userId)
    .first();

  if (!existing) return;
  await db.scheduleOverrides.delete(existing.id);
}

export async function replaceLocalScheduleOverrides(input: {
  userId: string;
  programId?: string;
  overrides: Array<{
    weekStartIso: string;
    dayIndex: number;
    adjustedDateIso: string;
  }>;
}): Promise<LocalScheduleOverride[]> {
  const db = getOfflineDb();
  const timestamp = nowIso();
  const existing = await listScheduleOverridesForUser(input.userId);
  const nextKeys = new Set(
    input.overrides.map((entry) => overrideKey(entry.weekStartIso, entry.dayIndex))
  );

  await db.transaction("rw", db.scheduleOverrides, async () => {
    for (const row of existing) {
      const key = overrideKey(row.weekStartIso, row.dayIndex);
      if (!nextKeys.has(key)) {
        await db.scheduleOverrides.delete(row.id);
      }
    }

    for (const entry of input.overrides) {
      const prior = existing.find(
        (row) =>
          row.weekStartIso === entry.weekStartIso &&
          row.dayIndex === entry.dayIndex
      );
      await db.scheduleOverrides.put({
        id: prior?.id ?? crypto.randomUUID(),
        userId: input.userId,
        programId: input.programId ?? prior?.programId,
        weekStartIso: entry.weekStartIso,
        dayIndex: entry.dayIndex,
        adjustedDateIso: entry.adjustedDateIso,
        updatedAt: timestamp,
        synced: false,
      });
    }
  });

  return listScheduleOverridesForUser(input.userId);
}

export async function cacheScheduleOverridesFromServer(
  userId: string,
  overrides: Array<{
    weekStartIso: string;
    dayIndex: number;
    adjustedDateIso: string;
    updatedAt: string;
    programId?: string;
  }>
): Promise<void> {
  const db = getOfflineDb();
  const timestamp = nowIso();

  await db.transaction("rw", db.scheduleOverrides, async () => {
    await db.scheduleOverrides.where("userId").equals(userId).delete();
    for (const entry of overrides) {
      await db.scheduleOverrides.put({
        id: crypto.randomUUID(),
        userId,
        programId: entry.programId,
        weekStartIso: entry.weekStartIso,
        dayIndex: entry.dayIndex,
        adjustedDateIso: entry.adjustedDateIso,
        updatedAt: entry.updatedAt ?? timestamp,
        synced: true,
      });
    }
  });
}

export async function markScheduleOverridesSynced(
  keys: Array<{ weekStartIso: string; dayIndex: number }>
): Promise<void> {
  const db = getOfflineDb();
  for (const key of keys) {
    const row = await db.scheduleOverrides
      .where("[weekStartIso+dayIndex]")
      .equals([key.weekStartIso, key.dayIndex])
      .first();
    if (row) {
      await db.scheduleOverrides.update(row.id, { synced: true });
    }
  }
}

export async function collectUnsyncedScheduleOverridePayload(userId: string): Promise<{
  overrides: LocalScheduleOverride[];
  deleted: Array<{ weekStartIso: string; dayIndex: number }>;
}> {
  const overrides = await listUnsyncedScheduleOverrides(userId);
  return { overrides, deleted: [] };
}
