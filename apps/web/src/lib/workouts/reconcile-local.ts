import {
  getOfflineDb,
  listSessionsForUser,
  markSynced,
} from "@forgefit/offline-sync";

/** Clear stale local unsynced flags when Supabase already has these sessions. */
export async function reconcileLocalWorkoutsWithServer(
  userId: string,
  serverClientIds: string[]
): Promise<void> {
  if (serverClientIds.length === 0) return;

  const serverIdSet = new Set(serverClientIds);
  const sessions = await listSessionsForUser(userId);
  const db = getOfflineDb();
  const sessionIdsToMark: string[] = [];

  for (const session of sessions) {
    if (!serverIdSet.has(session.clientId) || session.synced) continue;

    const sets = await db.exerciseSets
      .where("sessionClientId")
      .equals(session.clientId)
      .toArray();
    const hasUnsyncedSets = sets.some((set) => !set.synced);

    // Only clear the session flag when every set has synced — otherwise we can
    // drop pending RIR / set edits before they reach Supabase.
    if (!hasUnsyncedSets) {
      sessionIdsToMark.push(session.clientId);
    }
  }

  if (sessionIdsToMark.length === 0) return;

  await markSynced(sessionIdsToMark, []);
}
