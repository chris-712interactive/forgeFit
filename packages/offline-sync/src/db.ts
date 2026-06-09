import Dexie, { type Table } from "dexie";
import type {
  CachedProgram,
  LocalExerciseSet,
  LocalWorkoutSession,
} from "./types";

class ForgeFitDB extends Dexie {
  workoutSessions!: Table<LocalWorkoutSession, string>;
  exerciseSets!: Table<LocalExerciseSet, string>;
  cachedPrograms!: Table<CachedProgram, string>;

  constructor() {
    super("forgefit-offline");
    this.version(1).stores({
      workoutSessions: "clientId, userId, status, updatedAt",
      exerciseSets: "clientId, sessionClientId, [sessionClientId+exerciseId+setNumber]",
    });
    this.version(2).stores({
      workoutSessions: "clientId, userId, status, updatedAt",
      exerciseSets: "clientId, sessionClientId, [sessionClientId+exerciseId+setNumber]",
      cachedPrograms: "userId",
    });
    // userId index required for collectUnsyncedPayload / getPendingSyncCount
    this.version(3).stores({
      workoutSessions: "clientId, userId, status, updatedAt",
      exerciseSets:
        "clientId, sessionClientId, userId, [sessionClientId+exerciseId+setNumber]",
      cachedPrograms: "userId",
    });
  }
}

let dbInstance: ForgeFitDB | null = null;

export function getOfflineDb(): ForgeFitDB {
  if (typeof window === "undefined") {
    throw new Error("Offline database is only available in the browser.");
  }
  if (!dbInstance) {
    dbInstance = new ForgeFitDB();
  }
  return dbInstance;
}
