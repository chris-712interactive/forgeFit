import Dexie, { type Table } from "dexie";
import type {
  CachedProgram,
  LocalExerciseSet,
  LocalScheduleOverride,
  LocalWorkoutSession,
  LocalWorkoutTemplate,
} from "./types";
import type { LocalWorkoutDayAssignment } from "./day-assignment-types";

class ForgeFitDB extends Dexie {
  workoutSessions!: Table<LocalWorkoutSession, string>;
  exerciseSets!: Table<LocalExerciseSet, string>;
  cachedPrograms!: Table<CachedProgram, string>;
  scheduleOverrides!: Table<LocalScheduleOverride, string>;
  workoutTemplates!: Table<LocalWorkoutTemplate, string>;
  workoutDayAssignments!: Table<LocalWorkoutDayAssignment, string>;

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
    this.version(4).stores({
      workoutSessions: "clientId, userId, status, updatedAt",
      exerciseSets:
        "clientId, sessionClientId, userId, [sessionClientId+exerciseId+setNumber]",
      cachedPrograms: "userId",
      scheduleOverrides:
        "id, userId, [weekStartIso+dayIndex], weekStartIso, dayIndex, synced",
    });
    this.version(5).stores({
      workoutSessions: "clientId, userId, status, updatedAt, sessionSource",
      exerciseSets:
        "clientId, sessionClientId, userId, [sessionClientId+exerciseId+setNumber]",
      cachedPrograms: "userId",
      scheduleOverrides:
        "id, userId, [weekStartIso+dayIndex], weekStartIso, dayIndex, synced",
      workoutTemplates: "id, userId, updatedAt, synced",
    });
    this.version(6).stores({
      workoutSessions: "clientId, userId, status, updatedAt, sessionSource",
      exerciseSets:
        "clientId, sessionClientId, userId, [sessionClientId+exerciseId+setNumber]",
      cachedPrograms: "userId",
      scheduleOverrides:
        "id, userId, [weekStartIso+dayIndex], weekStartIso, dayIndex, synced",
      workoutTemplates: "id, userId, updatedAt, synced",
      workoutDayAssignments:
        "id, userId, scheduledDateIso, templateId, [userId+scheduledDateIso], synced",
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
