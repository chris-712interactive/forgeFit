import type { ProgramPlan } from "@forgefit/program-engine";

export type WorkoutStatus = "in_progress" | "completed" | "cancelled";

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
}

export interface LocalExerciseSet {
  clientId: string;
  sessionClientId: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps?: number;
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
}

export interface SyncSetPayload {
  clientId: string;
  sessionClientId: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps?: number;
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
