import type { AccountExportBundle } from "./export";
import { enrichSetWithEffort } from "./effort";
import { getSetsForSession, listSessionsForUser } from "@forgefit/offline-sync";

/** Fill missing server RIR from this device's offline workout cache. */
export async function mergeExportWithLocalWorkouts(
  bundle: AccountExportBundle,
  userId: string
): Promise<AccountExportBundle> {
  const localSetByClientId = new Map<string, { rir?: number }>();

  for (const session of await listSessionsForUser(userId)) {
    const sets = await getSetsForSession(session.clientId);
    for (const set of sets) {
      if (set.rir != null) {
        localSetByClientId.set(set.clientId, { rir: set.rir });
      }
    }
  }

  const workoutSessions = bundle.workoutSessions.map((session) => ({
    ...session,
    sets: session.sets.map((set) => {
      const serverRir = set.rir as number | null | undefined;
      if (serverRir != null) {
        return enrichSetWithEffort({ rir: serverRir, ...set });
      }

      const localSet = localSetByClientId.get(String(set.client_id ?? ""));
      if (localSet?.rir == null) {
        return enrichSetWithEffort({ rir: serverRir, ...set });
      }

      return enrichSetWithEffort({
        ...set,
        rir: localSet.rir,
      });
    }),
  }));

  return { ...bundle, workoutSessions };
}
