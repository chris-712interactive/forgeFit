import { getOfflineDb } from "./db";
import type { LocalWorkoutDayAssignment } from "./day-assignment-types";

function nowIso(): string {
  return new Date().toISOString();
}

export async function listDayAssignmentsForUser(
  userId: string
): Promise<LocalWorkoutDayAssignment[]> {
  const db = getOfflineDb();
  const rows = await db.workoutDayAssignments
    .where("userId")
    .equals(userId)
    .toArray();
  return rows.sort((a, b) => a.scheduledDateIso.localeCompare(b.scheduledDateIso));
}

export async function saveLocalDayAssignment(input: {
  userId: string;
  id?: string;
  templateId: string;
  scheduledDateIso: string;
  replacesProgram: boolean;
}): Promise<LocalWorkoutDayAssignment> {
  const db = getOfflineDb();
  const timestamp = nowIso();
  const id = input.id ?? crypto.randomUUID();
  const existing = await db.workoutDayAssignments.get(id);

  const row: LocalWorkoutDayAssignment = {
    id,
    userId: input.userId,
    templateId: input.templateId,
    scheduledDateIso: input.scheduledDateIso,
    replacesProgram: input.replacesProgram,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    synced: false,
  };

  await db.workoutDayAssignments.put(row);
  return row;
}

export async function deleteLocalDayAssignment(id: string): Promise<void> {
  const db = getOfflineDb();
  await db.workoutDayAssignments.delete(id);
}

export async function deleteLocalDayAssignmentsForDate(
  userId: string,
  scheduledDateIso: string
): Promise<void> {
  const db = getOfflineDb();
  const rows = await db.workoutDayAssignments
    .where("userId")
    .equals(userId)
    .filter((row) => row.scheduledDateIso === scheduledDateIso)
    .toArray();
  await db.transaction("rw", db.workoutDayAssignments, async () => {
    for (const row of rows) {
      await db.workoutDayAssignments.delete(row.id);
    }
  });
}

export async function replaceDayAssignmentsFromServer(
  userId: string,
  assignments: LocalWorkoutDayAssignment[]
): Promise<void> {
  const db = getOfflineDb();
  await db.transaction("rw", db.workoutDayAssignments, async () => {
    const existing = await db.workoutDayAssignments
      .where("userId")
      .equals(userId)
      .toArray();
    const unsynced = existing.filter((row) => !row.synced);
    const unsyncedIds = new Set(unsynced.map((row) => row.id));

    for (const row of existing) {
      if (!unsyncedIds.has(row.id)) {
        await db.workoutDayAssignments.delete(row.id);
      }
    }

    for (const assignment of assignments) {
      if (unsyncedIds.has(assignment.id)) continue;
      await db.workoutDayAssignments.put({ ...assignment, synced: true });
    }
  });
}

export async function markDayAssignmentsSynced(ids: string[]): Promise<void> {
  const db = getOfflineDb();
  await db.transaction("rw", db.workoutDayAssignments, async () => {
    for (const id of ids) {
      await db.workoutDayAssignments.update(id, { synced: true });
    }
  });
}
