import { hasFeature } from "@/lib/billing/gates";
import type { SubscriptionSnapshot } from "@/lib/billing/types";
import { addDaysIso, todayLocalIsoDate } from "@/lib/datetime/local-date";
import { getUserTimeZone } from "@/lib/datetime/timezone";
import { listIntegrationStatuses } from "@/lib/integrations/service";
import { createClient } from "@/lib/supabase/server";
import { integrationHasRecoveryScope } from "@forgefit/integrations";
import { recoveryMidpoint } from "./format";
import type {
  DailyRecoveryLog,
  DailyRecoveryStats,
  RecoveryContext,
} from "./types";

const CHART_DAYS = 14;
const WEEK_DAYS = 7;
const BASELINE_DAYS = 21;

function mapRecoveryRow(row: Record<string, unknown>): DailyRecoveryLog {
  return {
    recoveryDate: row.recovery_date as string,
    restingHrMin:
      row.resting_hr_min != null ? Number(row.resting_hr_min) : null,
    restingHrMax:
      row.resting_hr_max != null ? Number(row.resting_hr_max) : null,
    hrvMsMin: row.hrv_ms_min != null ? Number(row.hrv_ms_min) : null,
    hrvMsMax: row.hrv_ms_max != null ? Number(row.hrv_ms_max) : null,
    source: (row.source as string) ?? "fitbit",
  };
}

function isRecoveryTableMissing(error: {
  message?: string;
  code?: string;
}): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("daily_recovery_logs") ||
    message.includes("schema cache")
  );
}

function hasRecoveryMetrics(log: DailyRecoveryLog): boolean {
  return (
    log.restingHrMin != null ||
    log.restingHrMax != null ||
    log.hrvMsMin != null ||
    log.hrvMsMax != null
  );
}

function restingHrMidpoint(log: DailyRecoveryLog): number | null {
  return recoveryMidpoint(log.restingHrMin, log.restingHrMax);
}

function hrvMidpoint(log: DailyRecoveryLog): number | null {
  return recoveryMidpoint(log.hrvMsMin, log.hrvMsMax);
}

function fillDateSeries(
  logs: DailyRecoveryLog[],
  startDate: string,
  endDate: string
): DailyRecoveryLog[] {
  const byDate = new Map(logs.map((log) => [log.recoveryDate, log]));
  const series: DailyRecoveryLog[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    series.push(
      byDate.get(cursor) ?? {
        recoveryDate: cursor,
        restingHrMin: null,
        restingHrMax: null,
        hrvMsMin: null,
        hrvMsMax: null,
        source: "fitbit",
      }
    );
    cursor = addDaysIso(cursor, 1);
  }

  return series;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function computeStats(
  weekLogs: DailyRecoveryLog[],
  baselineLogs: DailyRecoveryLog[]
): DailyRecoveryStats | null {
  const withData = weekLogs.filter(hasRecoveryMetrics);
  if (withData.length === 0) {
    return null;
  }

  const restingValues = withData
    .map(restingHrMidpoint)
    .filter((value): value is number => value != null);
  const hrvValues = withData
    .map(hrvMidpoint)
    .filter((value): value is number => value != null);

  const baselineHrvValues = baselineLogs
    .map(hrvMidpoint)
    .filter((value): value is number => value != null);
  const hrvBaseline = average(baselineHrvValues);

  const lowHrvDays =
    hrvBaseline != null
      ? withData.filter((log) => {
          const hrv = hrvMidpoint(log);
          return hrv != null && hrv < hrvBaseline * 0.9;
        }).length
      : 0;

  const baselineRhrValues = baselineLogs
    .map(restingHrMidpoint)
    .filter((value): value is number => value != null);
  const rhrBaseline = average(baselineRhrValues);
  const avgRestingHrBpm = average(restingValues);

  const restingHrElevated =
    rhrBaseline != null &&
    avgRestingHrBpm != null &&
    avgRestingHrBpm > rhrBaseline * 1.05;

  return {
    daysWithData: withData.length,
    avgRestingHrBpm,
    avgHrvMs: average(hrvValues),
    lowHrvDays,
    restingHrElevated,
  };
}

function formatRecoveryDayLabel(
  isoDate: string | undefined,
  localToday: string
): string {
  if (!isoDate) return "Today";
  if (isoDate === localToday) return "Today";
  if (isoDate === addDaysIso(localToday, -1)) return "Yesterday";
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function resolveDisplayDay(
  logs: DailyRecoveryLog[],
  localToday: string
): DailyRecoveryLog | null {
  const byDate = new Map(logs.map((log) => [log.recoveryDate, log]));
  const todayLog = byDate.get(localToday) ?? null;

  if (todayLog && hasRecoveryMetrics(todayLog)) {
    return todayLog;
  }

  const yesterdayLog = byDate.get(addDaysIso(localToday, -1)) ?? null;
  if (yesterdayLog && hasRecoveryMetrics(yesterdayLog)) {
    return yesterdayLog;
  }

  return (
    [...logs]
      .filter(hasRecoveryMetrics)
      .sort((a, b) => b.recoveryDate.localeCompare(a.recoveryDate))[0] ??
    todayLog
  );
}

function emptyRecoveryContext(
  overrides: Partial<RecoveryContext> = {}
): RecoveryContext {
  return {
    unlocked: false,
    fitbitConnected: false,
    recoveryScopeGranted: false,
    lastSyncAt: null,
    lastSyncError: null,
    tableReady: true,
    latest: null,
    recoveryDayLabel: "Today",
    hasRecoveryData: false,
    series: [],
    weekStats: null,
    ...overrides,
  };
}

export async function getRecoveryContext(
  userId: string,
  subscription: SubscriptionSnapshot
): Promise<RecoveryContext> {
  const unlocked = hasFeature(subscription, "device_integrations");

  if (!unlocked) {
    return emptyRecoveryContext();
  }

  const statuses = await listIntegrationStatuses(userId);
  const fitbit = statuses.find((status) => status.provider === "fitbit");
  const fitbitConnected = fitbit?.connected ?? false;
  const recoveryScopeGranted = integrationHasRecoveryScope(
    fitbit?.scopes ?? null
  );

  const timeZone = await getUserTimeZone();
  const localToday = todayLocalIsoDate(new Date(), timeZone);
  const chartStart = addDaysIso(localToday, -(CHART_DAYS - 1));
  const chartEnd = addDaysIso(localToday, 1);
  const weekStart = addDaysIso(localToday, -(WEEK_DAYS - 1));
  const baselineStart = addDaysIso(localToday, -BASELINE_DAYS);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_recovery_logs")
    .select(
      "recovery_date, resting_hr_min, resting_hr_max, hrv_ms_min, hrv_ms_max, source"
    )
    .eq("user_id", userId)
    .gte("recovery_date", chartStart)
    .lte("recovery_date", chartEnd)
    .order("recovery_date", { ascending: true });

  if (error) {
    return emptyRecoveryContext({
      unlocked: true,
      fitbitConnected,
      recoveryScopeGranted,
      lastSyncAt: fitbit?.lastSyncAt ?? null,
      lastSyncError: fitbit?.lastSyncError ?? null,
      tableReady: !isRecoveryTableMissing(error),
    });
  }

  const logs = (data ?? []).map(mapRecoveryRow);
  const hasRecoveryData = logs.some(hasRecoveryMetrics);
  const displayDay = resolveDisplayDay(logs, localToday);
  const series = fillDateSeries(logs, chartStart, localToday);
  const weekLogs = series.filter((log) => log.recoveryDate >= weekStart);
  const baselineLogs = series.filter(
    (log) =>
      log.recoveryDate >= baselineStart && log.recoveryDate < weekStart
  );

  return {
    unlocked: true,
    fitbitConnected,
    recoveryScopeGranted,
    lastSyncAt: fitbit?.lastSyncAt ?? null,
    lastSyncError: fitbit?.lastSyncError ?? null,
    tableReady: true,
    latest: displayDay,
    recoveryDayLabel: formatRecoveryDayLabel(
      displayDay?.recoveryDate,
      localToday
    ),
    hasRecoveryData,
    series,
    weekStats: computeStats(weekLogs, baselineLogs),
  };
}
