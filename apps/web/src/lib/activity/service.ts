import { hasFeature } from "@/lib/billing/gates";
import type { SubscriptionSnapshot } from "@/lib/billing/types";
import { addDaysIso, todayLocalIsoDate } from "@/lib/datetime/local-date";
import { getUserTimeZone } from "@/lib/datetime/timezone";
import { listIntegrationStatuses } from "@/lib/integrations/service";
import { createClient } from "@/lib/supabase/server";
import type {
  ActivityContext,
  DailyActivityLog,
  DailyActivityStats,
} from "./types";
import {
  AZM_LOW_THRESHOLD,
  SEDENTARY_HIGH_MINUTES,
  STEPS_HIGH_THRESHOLD,
} from "./types";

const CHART_DAYS = 14;
const WEEK_DAYS = 7;

function mapActivityRow(row: Record<string, unknown>): DailyActivityLog {
  return {
    activityDate: row.activity_date as string,
    steps: row.steps != null ? Number(row.steps) : null,
    activeCalories:
      row.active_calories != null ? Number(row.active_calories) : null,
    activeMinutes:
      row.active_minutes != null ? Number(row.active_minutes) : null,
    activeZoneMinutes:
      row.active_zone_minutes != null ? Number(row.active_zone_minutes) : null,
    sedentaryMinutes:
      row.sedentary_minutes != null ? Number(row.sedentary_minutes) : null,
    totalCalories:
      row.total_calories != null ? Number(row.total_calories) : null,
    source: (row.source as string) ?? "fitbit",
  };
}

function isActivityTableMissing(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("daily_activity_logs") ||
    message.includes("schema cache")
  );
}

function fillDateSeries(
  logs: DailyActivityLog[],
  startDate: string,
  endDate: string
): DailyActivityLog[] {
  const byDate = new Map(logs.map((log) => [log.activityDate, log]));
  const series: DailyActivityLog[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    series.push(
      byDate.get(cursor) ?? {
        activityDate: cursor,
        steps: null,
        activeCalories: null,
        activeMinutes: null,
        activeZoneMinutes: null,
        sedentaryMinutes: null,
        totalCalories: null,
        source: "fitbit",
      }
    );
    cursor = addDaysIso(cursor, 1);
  }

  return series;
}

function computeStats(logs: DailyActivityLog[]): DailyActivityStats | null {
  const withData = logs.filter(hasActivityMetrics);

  if (withData.length === 0) {
    return null;
  }

  const sumSteps = withData.reduce((sum, log) => sum + (log.steps ?? 0), 0);
  const sumCalories = withData.reduce(
    (sum, log) => sum + (log.activeCalories ?? 0),
    0
  );
  const sumMinutes = withData.reduce(
    (sum, log) => sum + (log.activeMinutes ?? 0),
    0
  );
  const azmLogs = withData.filter((log) => log.activeZoneMinutes != null);
  const sedentaryLogs = withData.filter((log) => log.sedentaryMinutes != null);
  const totalCalorieLogs = withData.filter((log) => log.totalCalories != null);
  const count = withData.length;

  const highSedentaryDays = withData.filter(
    (log) =>
      log.sedentaryMinutes != null &&
      log.sedentaryMinutes >= SEDENTARY_HIGH_MINUTES
  ).length;

  const lowAzmHighStepsDays = withData.filter(
    (log) =>
      log.steps != null &&
      log.steps >= STEPS_HIGH_THRESHOLD &&
      log.activeZoneMinutes != null &&
      log.activeZoneMinutes < AZM_LOW_THRESHOLD
  ).length;

  return {
    avgSteps: Math.round(sumSteps / count),
    avgActiveCalories: Math.round(sumCalories / count),
    avgActiveMinutes: Math.round(sumMinutes / count),
    avgActiveZoneMinutes:
      azmLogs.length > 0
        ? Math.round(
            azmLogs.reduce((sum, log) => sum + (log.activeZoneMinutes ?? 0), 0) /
              azmLogs.length
          )
        : null,
    avgSedentaryMinutes:
      sedentaryLogs.length > 0
        ? Math.round(
            sedentaryLogs.reduce(
              (sum, log) => sum + (log.sedentaryMinutes ?? 0),
              0
            ) / sedentaryLogs.length
          )
        : null,
    avgTotalCalories:
      totalCalorieLogs.length > 0
        ? Math.round(
            totalCalorieLogs.reduce(
              (sum, log) => sum + (log.totalCalories ?? 0),
              0
            ) / totalCalorieLogs.length
          )
        : null,
    totalSteps: sumSteps,
    daysWithData: count,
    highSedentaryDays,
    lowAzmHighStepsDays,
  };
}

function hasActivityMetrics(log: DailyActivityLog): boolean {
  return (
    log.steps != null ||
    log.activeCalories != null ||
    log.activeMinutes != null ||
    log.activeZoneMinutes != null ||
    log.sedentaryMinutes != null ||
    log.totalCalories != null
  );
}

function hasExtendedActivityMetrics(log: DailyActivityLog): boolean {
  return (
    log.activeZoneMinutes != null ||
    log.sedentaryMinutes != null ||
    log.totalCalories != null
  );
}

function formatActivityDayLabel(
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

/** Prefer today's log; fall back for timezone gaps or partial syncs. */
function resolveDisplayDay(
  logs: DailyActivityLog[],
  localToday: string
): DailyActivityLog | null {
  const byDate = new Map(logs.map((log) => [log.activityDate, log]));
  const todayLog = byDate.get(localToday) ?? null;

  if (todayLog && hasActivityMetrics(todayLog)) {
    return todayLog;
  }

  const yesterdayLog = byDate.get(addDaysIso(localToday, -1)) ?? null;
  if (yesterdayLog && hasActivityMetrics(yesterdayLog)) {
    return yesterdayLog;
  }

  const latest = [...logs]
    .filter(hasActivityMetrics)
    .sort((a, b) => b.activityDate.localeCompare(a.activityDate))[0];

  return latest ?? todayLog;
}

function emptyActivityContext(
  overrides: Partial<ActivityContext> = {}
): ActivityContext {
  return {
    unlocked: false,
    fitbitConnected: false,
    lastSyncAt: null,
    lastSyncError: null,
    tableReady: true,
    today: null,
    activityDayLabel: "Today",
    hasActivityData: false,
    hasExtendedActivityData: false,
    series: [],
    weekStats: null,
    ...overrides,
  };
}

export async function getActivityContext(
  userId: string,
  subscription: SubscriptionSnapshot
): Promise<ActivityContext> {
  const unlocked = hasFeature(subscription, "device_integrations");

  if (!unlocked) {
    return emptyActivityContext();
  }

  const statuses = await listIntegrationStatuses(userId);
  const fitbit = statuses.find((status) => status.provider === "fitbit");
  const fitbitConnected = fitbit?.connected ?? false;

  const timeZone = await getUserTimeZone();
  const localToday = todayLocalIsoDate(new Date(), timeZone);
  const chartStart = addDaysIso(localToday, -(CHART_DAYS - 1));
  const chartEnd = addDaysIso(localToday, 1);
  const weekStart = addDaysIso(localToday, -(WEEK_DAYS - 1));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_activity_logs")
    .select(
      "activity_date, steps, active_calories, active_minutes, active_zone_minutes, sedentary_minutes, total_calories, source"
    )
    .eq("user_id", userId)
    .gte("activity_date", chartStart)
    .lte("activity_date", chartEnd)
    .order("activity_date", { ascending: true });

  if (error) {
    return emptyActivityContext({
      unlocked: true,
      fitbitConnected,
      lastSyncAt: fitbit?.lastSyncAt ?? null,
      lastSyncError: fitbit?.lastSyncError ?? null,
      tableReady: !isActivityTableMissing(error),
    });
  }

  const logs = (data ?? []).map(mapActivityRow);
  const hasActivityData = logs.some(hasActivityMetrics);
  const hasExtendedActivityData = logs.some(hasExtendedActivityMetrics);
  const displayDay = resolveDisplayDay(logs, localToday);
  const series = fillDateSeries(logs, chartStart, localToday);
  const weekLogs = series.filter((log) => log.activityDate >= weekStart);

  return {
    unlocked: true,
    fitbitConnected,
    lastSyncAt: fitbit?.lastSyncAt ?? null,
    lastSyncError: fitbit?.lastSyncError ?? null,
    tableReady: true,
    today: displayDay,
    activityDayLabel: formatActivityDayLabel(
      displayDay?.activityDate,
      localToday
    ),
    hasActivityData,
    hasExtendedActivityData,
    series,
    weekStats: computeStats(weekLogs),
  };
}
