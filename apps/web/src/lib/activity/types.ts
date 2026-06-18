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
  /** Best day to show on Home — prefers today, then yesterday, then latest log. */
  today: DailyActivityLog | null;
  /** Label for the Home activity row ("Today", "Yesterday", or a short date). */
  activityDayLabel: string;
  /** True when any stored day in the chart window has metrics. */
  hasActivityData: boolean;
  series: DailyActivityLog[];
  weekStats: DailyActivityStats | null;
}
