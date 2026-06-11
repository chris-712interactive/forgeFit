import type { ProgramPlan, RecoveryBlock, WarmupBlock } from "@forgefit/program-engine";

export type WorkoutStatus = "in_progress" | "completed" | "cancelled";
export type RecoveryStatus = "pending" | "completed" | "skipped";
export type WarmupStatus = "pending" | "completed" | "skipped";

export interface CachedProgram {
  userId: string;
  programId?: string;
  plan: ProgramPlan;
  cachedAt: string;
}

export interface ExerciseSnapshot {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  /** Extra working sets added by RIR-based progression */
  extraSets?: number;
  /** Human-readable note shown during the workout */
  progressionNote?: string;
  /** Prescription notes from the program (e.g. ramp-up sets) */
  notes?: string;
}

export interface LocalWorkoutSession {
  clientId: string;
  userId: string;
  programId?: string;
  sessionName: string;
  dayIndex: number;
  status: WorkoutStatus;
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
  synced: boolean;
  exercises: ExerciseSnapshot[];
  warmupBlock?: WarmupBlock;
  warmupStatus?: WarmupStatus;
  warmupDurationMs?: number;
  warmupCompletedAt?: string;
  recoveryBlock?: RecoveryBlock;
  recoveryStatus?: RecoveryStatus;
  recoveryDurationMs?: number;
  recoveryCompletedAt?: string;
}

export interface LocalExerciseSet {
  clientId: string;
  sessionClientId: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps?: number;
  /** Elapsed time for timed sets (holds, cardio) in milliseconds */
  durationMs?: number;
  weightKg?: number;
  rir?: number;
  completed: boolean;
  completedAt?: string;
  updatedAt: string;
  synced: boolean;
}

export interface SyncSessionPayload {
  clientId: string;
  programId?: string;
  sessionName: string;
  dayIndex: number;
  status: WorkoutStatus;
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
  warmupName?: string;
  warmupPlannedMinutes?: number;
  warmupStatus?: Extract<WarmupStatus, "completed" | "skipped">;
  warmupDurationMs?: number;
  warmupCompletedAt?: string;
  recoveryName?: string;
  recoveryEquipment?: string;
  recoveryPlannedMinutes?: number;
  recoveryStatus?: Extract<RecoveryStatus, "completed" | "skipped">;
  recoveryDurationMs?: number;
  recoveryCompletedAt?: string;
}

export interface SyncSetPayload {
  clientId: string;
  sessionClientId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps?: number;
  durationMs?: number;
  weightKg?: number;
  rir?: number;
  completed: boolean;
  completedAt?: string;
  updatedAt: string;
}

export interface SyncRequestBody {
  sessions: SyncSessionPayload[];
  sets: SyncSetPayload[];
}

export interface SyncResponseBody {
  syncedSessions: number;
  syncedSets: number;
}
