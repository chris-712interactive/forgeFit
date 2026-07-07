export interface LocalScheduleOverride {
  id: string;
  userId: string;
  programId?: string;
  weekStartIso: string;
  dayIndex: number;
  adjustedDateIso: string;
  updatedAt: string;
  synced: boolean;
}

export interface ScheduleOverridePayload {
  weekStartIso: string;
  dayIndex: number;
  adjustedDateIso: string;
  updatedAt: string;
}

export interface ScheduleOverrideSyncRequestBody {
  overrides: ScheduleOverridePayload[];
  deleted: Array<{
    weekStartIso: string;
    dayIndex: number;
  }>;
}

export interface ScheduleOverrideSyncResponseBody {
  syncedOverrides: number;
  deletedOverrides: number;
}
