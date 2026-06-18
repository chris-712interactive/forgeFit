export interface DailyRecoveryLog {
  recoveryDate: string;
  restingHrMin: number | null;
  restingHrMax: number | null;
  hrvMsMin: number | null;
  hrvMsMax: number | null;
  source: string;
}

export interface DailyRecoveryStats {
  daysWithData: number;
  avgRestingHrBpm: number | null;
  avgHrvMs: number | null;
  /** Days in window with HRV below personal baseline. */
  lowHrvDays: number;
  /** True when 7-day avg resting HR is >5% above 21-day baseline. */
  restingHrElevated: boolean;
}

export interface RecoveryContext {
  unlocked: boolean;
  fitbitConnected: boolean;
  recoveryScopeGranted: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  tableReady: boolean;
  latest: DailyRecoveryLog | null;
  recoveryDayLabel: string;
  hasRecoveryData: boolean;
  series: DailyRecoveryLog[];
  weekStats: DailyRecoveryStats | null;
}
