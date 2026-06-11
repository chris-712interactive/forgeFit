import { getOfflineDb } from "./db";

/** Remove a user's cached workouts and program from this device. */
export async function clearOfflineUserData(userId: string): Promise<void> {
  const db = getOfflineDb();
  const sessions = await db.workoutSessions
    .where("userId")
    .equals(userId)
    .toArray();

  await db.transaction(
    "rw",
    db.workoutSessions,
    db.exerciseSets,
    db.cachedPrograms,
    async () => {
      for (const session of sessions) {
        await db.exerciseSets
          .where("sessionClientId")
          .equals(session.clientId)
          .delete();
      }

      await db.exerciseSets.where("userId").equals(userId).delete();
      await db.workoutSessions.where("userId").equals(userId).delete();
      await db.cachedPrograms.where("userId").equals(userId).delete();
    }
  );
}
