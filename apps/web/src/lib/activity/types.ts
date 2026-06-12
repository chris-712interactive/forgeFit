export interface DailyActivityLog {
  activityDate: string;
  steps: number | null;
  activeCalories: number | null;
  activeMinutes: number | null;
  source: string;
}

export interface DailyActivityStats {
  avgSteps: number | null;
  avgActiveCalories: number | null;
  avgActiveMinutes: number | null;
  totalSteps: number;
  daysWithData: number;
}

export interface ActivityContext {
  unlocked: boolean;
  fitbitConnected: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  tableReady: boolean;
  today: DailyActivityLog | null;
  series: DailyActivityLog[];
  weekStats: DailyActivityStats | null;
}
