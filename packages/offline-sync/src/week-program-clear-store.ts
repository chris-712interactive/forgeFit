import { getOfflineDb } from "./db";
import type { LocalWeekProgramClear } from "./week-program-clear-types";

function nowIso(): string {
  return new Date().toISOString();
}

export async function listWeekProgramClearsForUser(
  userId: string
): Promise<LocalWeekProgramClear[]> {
  const db = getOfflineDb();
  const rows = await db.weekProgramClears.where("userId").equals(userId).toArray();
  return rows.sort((a, b) => b.weekStartIso.localeCompare(a.weekStartIso));
}

export async function saveLocalWeekProgramClear(input: {
  userId: string;
  id?: string;
  weekStartIso: string;
}): Promise<LocalWeekProgramClear> {
  const db = getOfflineDb();
  const timestamp = nowIso();
  const existing = await db.weekProgramClears
    .where("userId")
    .equals(input.userId)
    .filter((row) => row.weekStartIso === input.weekStartIso)
    .first();

  const row: LocalWeekProgramClear = {
    id: input.id ?? existing?.id ?? crypto.randomUUID(),
    userId: input.userId,
    weekStartIso: input.weekStartIso,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    synced: false,
  };

  if (existing && existing.id !== row.id) {
    await db.weekProgramClears.delete(existing.id);
  }
  await db.weekProgramClears.put(row);
  return row;
}

export async function deleteLocalWeekProgramClear(
  userId: string,
  weekStartIso: string
): Promise<void> {
  const db = getOfflineDb();
  const rows = await db.weekProgramClears
    .where("userId")
    .equals(userId)
    .filter((row) => row.weekStartIso === weekStartIso)
    .toArray();
  await db.transaction("rw", db.weekProgramClears, async () => {
    for (const row of rows) {
      await db.weekProgramClears.delete(row.id);
    }
  });
}

export async function replaceWeekProgramClearsFromServer(
  userId: string,
  clears: LocalWeekProgramClear[]
): Promise<void> {
  const db = getOfflineDb();
  await db.transaction("rw", db.weekProgramClears, async () => {
    const existing = await db.weekProgramClears
      .where("userId")
      .equals(userId)
      .toArray();
    const unsynced = existing.filter((row) => !row.synced);
    const unsyncedIds = new Set(unsynced.map((row) => row.id));

    for (const row of existing) {
      if (!unsyncedIds.has(row.id)) {
        await db.weekProgramClears.delete(row.id);
      }
    }

    for (const clear of clears) {
      if (unsyncedIds.has(clear.id)) continue;
      await db.weekProgramClears.put({ ...clear, synced: true });
    }
  });
}
