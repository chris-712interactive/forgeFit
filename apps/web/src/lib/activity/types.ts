export interface DailyActivityLog {
  activityDate: string;
  steps: number | null;
  activeCalories: number | null;
  activeMinutes: number | null;
  activeZoneMinutes: number | null;
  sedentaryMinutes: number | null;
  totalCalories: number | null;
  source: string;
}

/** Steps above this with low AZM suggests walking-heavy, cardio-light days. */
export const STEPS_HIGH_THRESHOLD = 8000;

/** Fitbit default AZM goal is 22; below this is "low" cardio intensity. */
export const AZM_LOW_THRESHOLD = 15;

/** Sedentary time above this (10h) is flagged for lifestyle nudges. */
export const SEDENTARY_HIGH_MINUTES = 600;

export interface DailyActivityStats {
  avgSteps: number | null;
  avgActiveCalories: number | null;
  avgActiveMinutes: number | null;
  avgActiveZoneMinutes: number | null;
  avgSedentaryMinutes: number | null;
  avgTotalCalories: number | null;
  totalSteps: number;
  daysWithData: number;
  highSedentaryDays: number;
  lowAzmHighStepsDays: number;
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
  /** True when AZM, sedentary, or total calories are present in the window. */
  hasExtendedActivityData: boolean;
  series: DailyActivityLog[];
  weekStats: DailyActivityStats | null;
}
