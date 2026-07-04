import type { ProgramPlan } from "@forgefit/program-engine";
import { getOfflineDb } from "./db";
import type { CachedProgram } from "./types";

export type { CachedProgram };

export async function cacheProgramPlan(
  userId: string,
  plan: ProgramPlan,
  programId?: string,
  userEquipment?: string[]
): Promise<void> {
  const db = getOfflineDb();
  await db.cachedPrograms.put({
    userId,
    programId,
    plan,
    cachedAt: new Date().toISOString(),
    userEquipment,
  });
}

export async function getCachedProgramPlan(
  userId: string
): Promise<CachedProgram | undefined> {
  const db = getOfflineDb();
  return db.cachedPrograms.get(userId);
}
