import { hasFeature } from "@/lib/billing/gates";
import type { SubscriptionSnapshot } from "@/lib/billing/types";
import { listIntegrationStatuses } from "@/lib/integrations/service";
import { createClient } from "@/lib/supabase/server";
import type {
  ActivityContext,
  DailyActivityLog,
  DailyActivityStats,
} from "./types";

const CHART_DAYS = 14;
const WEEK_DAYS = 7;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function subtractDays(isoDate: string, days: number): string {
  return addDays(isoDate, -days);
}

function mapActivityRow(row: Record<string, unknown>): DailyActivityLog {
  return {
    activityDate: row.activity_date as string,
    steps: row.steps != null ? Number(row.steps) : null,
    activeCalories:
      row.active_calories != null ? Number(row.active_calories) : null,
    activeMinutes:
      row.active_minutes != null ? Number(row.active_minutes) : null,
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
        source: "fitbit",
      }
    );
    cursor = addDays(cursor, 1);
  }

  return series;
}

function computeStats(logs: DailyActivityLog[]): DailyActivityStats | null {
  const withData = logs.filter(
    (log) =>
      log.steps != null ||
      log.activeCalories != null ||
      log.activeMinutes != null
  );

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
  const count = withData.length;

  return {
    avgSteps: Math.round(sumSteps / count),
    avgActiveCalories: Math.round(sumCalories / count),
    avgActiveMinutes: Math.round(sumMinutes / count),
    totalSteps: sumSteps,
    daysWithData: count,
  };
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

  const today = todayIsoDate();
  const chartStart = subtractDays(today, CHART_DAYS - 1);
  const weekStart = subtractDays(today, WEEK_DAYS - 1);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_activity_logs")
    .select("activity_date, steps, active_calories, active_minutes, source")
    .eq("user_id", userId)
    .gte("activity_date", chartStart)
    .lte("activity_date", today)
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
  const series = fillDateSeries(logs, chartStart, today);
  const weekLogs = series.filter((log) => log.activityDate >= weekStart);

  return {
    unlocked: true,
    fitbitConnected,
    lastSyncAt: fitbit?.lastSyncAt ?? null,
    lastSyncError: fitbit?.lastSyncError ?? null,
    tableReady: true,
    today: series.find((log) => log.activityDate === today) ?? null,
    series,
    weekStats: computeStats(weekLogs),
  };
}
