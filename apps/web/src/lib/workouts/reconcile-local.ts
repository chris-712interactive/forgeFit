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
  const staleSessions = sessions.filter(
    (s) => serverIdSet.has(s.clientId) && !s.synced
  );

  if (staleSessions.length === 0) return;

  const db = getOfflineDb();
  const sessionIds = staleSessions.map((s) => s.clientId);
  const setIds: string[] = [];

  for (const sessionId of sessionIds) {
    const sets = await db.exerciseSets
      .where("sessionClientId")
      .equals(sessionId)
      .toArray();
    for (const set of sets) {
      if (!set.synced) {
        setIds.push(set.clientId);
      }
    }
  }

  await markSynced(sessionIds, setIds);
}
