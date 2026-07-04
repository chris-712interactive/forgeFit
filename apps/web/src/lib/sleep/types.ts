export interface DailySleepLog {
  sleepDate: string;
  durationMinutes: number | null;
  minutesInBed: number | null;
  deepMinutes: number | null;
  remMinutes: number | null;
  awakeMinutes: number | null;
  wakeAt: string | null;
  wakeLocalMinutes: number | null;
  source: string;
}

export interface DailySleepStats {
  avgDurationMinutes: number | null;
  nightsWithData: number;
  shortNights: number;
}

export interface BedtimeSuggestion {
  show: boolean;
  avgWakeLabel: string;
  suggestedBedtimeLabel: string;
  avgDurationMinutes: number;
  targetMinutes: number;
  summary: string;
  wakeTimeVaries: boolean;
}

export interface SleepContext {
  unlocked: boolean;
  fitbitConnected: boolean;
  sleepScopeGranted: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  tableReady: boolean;
  /** Best night to show on Home — prefers today, then yesterday, then latest log. */
  lastNight: DailySleepLog | null;
  sleepDayLabel: string;
  hasSleepData: boolean;
  series: DailySleepLog[];
  weekStats: DailySleepStats | null;
  bedtimeSuggestion: BedtimeSuggestion | null;
}

/** Evidence target: 7–9 hours for recovery (see recovery_sleep rule). */
export const SLEEP_TARGET_MIN_MINUTES = 7 * 60;
export const SLEEP_TARGET_HOURS = SLEEP_TARGET_MIN_MINUTES / 60;
