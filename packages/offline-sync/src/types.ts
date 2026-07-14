import type { ProgramPlan, RecoveryBlock, WarmupBlock, ConditioningBlock } from "@forgefit/program-engine";

export type WorkoutStatus = "in_progress" | "completed" | "cancelled";
export type RecoveryStatus = "pending" | "completed" | "skipped";
export type WarmupStatus = "pending" | "completed" | "skipped";
export type ConditioningStatus = "pending" | "completed" | "skipped";
export type SubstitutionReason = "equipment_busy" | "user_choice";
export type WorkoutSessionSource = "program" | "custom" | "imported";

/** Custom-workout interval protocol (Phase 13). */
export type IntervalMode = "density" | "tabata" | "superset_block";

export interface IntervalProtocol {
  mode: IntervalMode;
  /** Work phase length in seconds. */
  workSeconds: number;
  /** Rest phase length in seconds (between rounds or between pairs). */
  restSeconds: number;
  /** Rounds per exercise for density/tabata. Unused for superset_block. */
  rounds: number;
  /** Extra rest after finishing an exercise's rounds (tabata). */
  betweenExerciseRestSeconds?: number;
}

export interface CachedProgram {
  userId: string;
  programId?: string;
  plan: ProgramPlan;
  cachedAt: string;
  userEquipment?: string[];
}

export interface ExerciseSnapshot {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  /** Superset / pair letter (e.g. "A") for interval protocols. */
  groupId?: string;
  /** Original program exercise before an in-session swap */
  plannedExerciseId?: string;
  plannedExerciseName?: string;
  substitutedAt?: string;
  substitutionReason?: SubstitutionReason;
  /** Extra working sets added by RIR-based progression */
  extraSets?: number;
  /** Human-readable note shown during the workout */
  progressionNote?: string;
  /** Prescription notes from the program (e.g. ramp-up sets) */
  notes?: string;
}

export interface WorkoutTemplateExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  /** Superset / pair letter (e.g. "A") for interval protocols. */
  groupId?: string;
}

export interface LocalWorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  exercises: WorkoutTemplateExercise[];
  warmup?: WarmupBlock;
  intervalProtocol?: IntervalProtocol;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export interface LocalWorkoutSession {
  clientId: string;
  userId: string;
  programId?: string;
  sessionName: string;
  dayIndex: number;
  sessionSource?: WorkoutSessionSource;
  templateId?: string;
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
  conditioningBlock?: ConditioningBlock;
  conditioningStatus?: ConditioningStatus;
  conditioningRoundsCompleted?: number;
  intervalProtocol?: IntervalProtocol;
}

export interface LocalExerciseSet {
  clientId: string;
  sessionClientId: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  plannedExerciseId?: string;
  substitutionReason?: SubstitutionReason;
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
  sessionSource?: WorkoutSessionSource;
  templateId?: string;
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
  plannedExerciseId?: string;
  substitutionReason?: SubstitutionReason;
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

export type { LocalScheduleOverride } from "./schedule-override-types";
