import { hasFeature } from "@/lib/billing/gates";
import type { SubscriptionSnapshot } from "@/lib/billing/types";
import { addDaysIso, todayLocalIsoDate } from "@/lib/datetime/local-date";
import { getUserTimeZone } from "@/lib/datetime/timezone";
import { listIntegrationStatuses } from "@/lib/integrations/service";
import { createClient } from "@/lib/supabase/server";
import { integrationHasSleepScope } from "@forgefit/integrations";
import type { DailySleepLog, DailySleepStats, SleepContext } from "./types";
import { SLEEP_TARGET_MIN_MINUTES } from "./types";
import {
  buildBedtimeSuggestion,
  enrichWakeLocalMinutes,
} from "./bedtime-suggestion";

const CHART_DAYS = 14;
const WEEK_DAYS = 7;

function mapSleepRow(row: Record<string, unknown>): DailySleepLog {
  return {
    sleepDate: row.sleep_date as string,
    durationMinutes:
      row.duration_minutes != null ? Number(row.duration_minutes) : null,
    minutesInBed:
      row.minutes_in_bed != null ? Number(row.minutes_in_bed) : null,
    deepMinutes: row.deep_minutes != null ? Number(row.deep_minutes) : null,
    remMinutes: row.rem_minutes != null ? Number(row.rem_minutes) : null,
    awakeMinutes:
      row.awake_minutes != null ? Number(row.awake_minutes) : null,
    wakeAt: (row.wake_at as string | null) ?? null,
    wakeLocalMinutes:
      row.wake_local_minutes != null ? Number(row.wake_local_minutes) : null,
    source: (row.source as string) ?? "fitbit",
  };
}

function isSleepTableMissing(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("daily_sleep_logs") ||
    message.includes("schema cache")
  );
}

function fillDateSeries(
  logs: DailySleepLog[],
  startDate: string,
  endDate: string
): DailySleepLog[] {
  const byDate = new Map(logs.map((log) => [log.sleepDate, log]));
  const series: DailySleepLog[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    series.push(
      byDate.get(cursor) ?? {
        sleepDate: cursor,
        durationMinutes: null,
        minutesInBed: null,
        deepMinutes: null,
        remMinutes: null,
        awakeMinutes: null,
        wakeAt: null,
        wakeLocalMinutes: null,
        source: "fitbit",
      }
    );
    cursor = addDaysIso(cursor, 1);
  }

  return series;
}

function hasSleepMetrics(log: DailySleepLog): boolean {
  return log.durationMinutes != null && log.durationMinutes > 0;
}

function computeStats(logs: DailySleepLog[]): DailySleepStats | null {
  const withData = logs.filter(hasSleepMetrics);
  if (withData.length === 0) {
    return null;
  }

  const sumDuration = withData.reduce(
    (sum, log) => sum + (log.durationMinutes ?? 0),
    0
  );
  const shortNights = withData.filter(
    (log) => (log.durationMinutes ?? 0) < SLEEP_TARGET_MIN_MINUTES
  ).length;

  return {
    avgDurationMinutes: Math.round(sumDuration / withData.length),
    nightsWithData: withData.length,
    shortNights,
  };
}

function formatSleepDayLabel(
  isoDate: string | undefined,
  localToday: string
): string {
  if (!isoDate) return "Last night";
  if (isoDate === localToday) return "Last night";
  if (isoDate === addDaysIso(localToday, -1)) return "Previous night";
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function resolveDisplayNight(
  logs: DailySleepLog[],
  localToday: string
): DailySleepLog | null {
  const byDate = new Map(logs.map((log) => [log.sleepDate, log]));
  const todayLog = byDate.get(localToday) ?? null;

  if (todayLog && hasSleepMetrics(todayLog)) {
    return todayLog;
  }

  const yesterdayLog = byDate.get(addDaysIso(localToday, -1)) ?? null;
  if (yesterdayLog && hasSleepMetrics(yesterdayLog)) {
    return yesterdayLog;
  }

  const latest = [...logs]
    .filter(hasSleepMetrics)
    .sort((a, b) => b.sleepDate.localeCompare(a.sleepDate))[0];

  return latest ?? todayLog;
}

function emptySleepContext(
  overrides: Partial<SleepContext> = {}
): SleepContext {
  return {
    unlocked: false,
    fitbitConnected: false,
    sleepScopeGranted: false,
    lastSyncAt: null,
    lastSyncError: null,
    tableReady: true,
    lastNight: null,
    sleepDayLabel: "Last night",
    hasSleepData: false,
    series: [],
    weekStats: null,
    bedtimeSuggestion: null,
    ...overrides,
  };
}

export async function getSleepContext(
  userId: string,
  subscription: SubscriptionSnapshot
): Promise<SleepContext> {
  const unlocked = hasFeature(subscription, "device_integrations");

  if (!unlocked) {
    return emptySleepContext();
  }

  const statuses = await listIntegrationStatuses(userId);
  const fitbit = statuses.find((status) => status.provider === "fitbit");
  const fitbitConnected = fitbit?.connected ?? false;
  const sleepScopeGranted = integrationHasSleepScope(fitbit?.scopes ?? null);

  const timeZone = await getUserTimeZone();
  const localToday = todayLocalIsoDate(new Date(), timeZone);
  const chartStart = addDaysIso(localToday, -(CHART_DAYS - 1));
  const chartEnd = addDaysIso(localToday, 1);
  const weekStart = addDaysIso(localToday, -(WEEK_DAYS - 1));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_sleep_logs")
    .select(
      "sleep_date, duration_minutes, minutes_in_bed, deep_minutes, rem_minutes, awake_minutes, wake_at, wake_local_minutes, source"
    )
    .eq("user_id", userId)
    .gte("sleep_date", chartStart)
    .lte("sleep_date", chartEnd)
    .order("sleep_date", { ascending: true });

  if (error) {
    return emptySleepContext({
      unlocked: true,
      fitbitConnected,
      sleepScopeGranted,
      lastSyncAt: fitbit?.lastSyncAt ?? null,
      lastSyncError: fitbit?.lastSyncError ?? null,
      tableReady: !isSleepTableMissing(error),
    });
  }

  const logs = (data ?? []).map(mapSleepRow);
  const hasSleepData = logs.some(hasSleepMetrics);
  const displayNight = resolveDisplayNight(logs, localToday);
  const series = fillDateSeries(logs, chartStart, localToday);
  const weekLogs = series
    .filter((log) => log.sleepDate >= weekStart)
    .map((log) => enrichWakeLocalMinutes(log, timeZone));
  const bedtimeSuggestion = buildBedtimeSuggestion(weekLogs, localToday);

  return {
    unlocked: true,
    fitbitConnected,
    sleepScopeGranted,
    lastSyncAt: fitbit?.lastSyncAt ?? null,
    lastSyncError: fitbit?.lastSyncError ?? null,
    tableReady: true,
    lastNight: displayNight,
    sleepDayLabel: formatSleepDayLabel(displayNight?.sleepDate, localToday),
    hasSleepData,
    series,
    weekStats: computeStats(weekLogs),
    bedtimeSuggestion,
  };
}
