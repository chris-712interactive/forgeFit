import { getOfflineDb } from "./db";
import type {
  IntervalProtocol,
  LocalWorkoutTemplate,
  WorkoutTemplateExercise,
} from "./types";
import type { WarmupBlock } from "@forgefit/program-engine";

function nowIso(): string {
  return new Date().toISOString();
}

export async function listTemplatesForUser(
  userId: string
): Promise<LocalWorkoutTemplate[]> {
  const db = getOfflineDb();
  const rows = await db.workoutTemplates.where("userId").equals(userId).toArray();
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getTemplate(
  id: string
): Promise<LocalWorkoutTemplate | undefined> {
  const db = getOfflineDb();
  return db.workoutTemplates.get(id);
}

export async function saveLocalTemplate(input: {
  userId: string;
  id?: string;
  name: string;
  exercises: WorkoutTemplateExercise[];
  warmup?: WarmupBlock;
  intervalProtocol?: IntervalProtocol;
}): Promise<LocalWorkoutTemplate> {
  const db = getOfflineDb();
  const timestamp = nowIso();
  const id = input.id ?? crypto.randomUUID();

  const existing = await db.workoutTemplates.get(id);
  const row: LocalWorkoutTemplate = {
    id,
    userId: input.userId,
    name: input.name.trim(),
    exercises: input.exercises,
    warmup: input.warmup,
    intervalProtocol: input.intervalProtocol,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    synced: false,
  };

  await db.workoutTemplates.put(row);
  return row;
}

export async function deleteLocalTemplate(id: string): Promise<void> {
  const db = getOfflineDb();
  await db.workoutTemplates.delete(id);
}

export async function markTemplatesSynced(ids: string[]): Promise<void> {
  const db = getOfflineDb();
  await db.transaction("rw", db.workoutTemplates, async () => {
    for (const id of ids) {
      await db.workoutTemplates.update(id, { synced: true });
    }
  });
}

export async function replaceTemplatesFromServer(
  userId: string,
  templates: LocalWorkoutTemplate[]
): Promise<void> {
  const db = getOfflineDb();
  await db.transaction("rw", db.workoutTemplates, async () => {
    const existing = await db.workoutTemplates.where("userId").equals(userId).toArray();
    const unsynced = existing.filter((row) => !row.synced);
    const unsyncedIds = new Set(unsynced.map((row) => row.id));

    for (const row of existing) {
      if (!unsyncedIds.has(row.id)) {
        await db.workoutTemplates.delete(row.id);
      }
    }

    for (const template of templates) {
      if (unsyncedIds.has(template.id)) continue;
      await db.workoutTemplates.put({ ...template, synced: true });
    }
  });
}

export async function collectUnsyncedTemplates(
  userId: string
): Promise<LocalWorkoutTemplate[]> {
  const db = getOfflineDb();
  return db.workoutTemplates
    .where("userId")
    .equals(userId)
    .filter((row) => !row.synced)
    .toArray();
}
