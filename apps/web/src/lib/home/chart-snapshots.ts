import { addDaysIso, todayLocalIsoDate } from "@/lib/datetime/local-date";
import type { DailyActivityLog } from "@/lib/activity/types";
import type { BodyMeasurementRow } from "@/lib/measurements/types";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export interface HomeChartPoint {
  date: string;
  label: string;
  value: number | null;
}

export interface HomeWeightPoint {
  date: string;
  label: string;
  weightKg: number | null;
}

export interface HomeChartSnapshots {
  sessionsByDay: HomeChartPoint[];
  weightByDay: HomeWeightPoint[];
  weightDeltaKg: number | null;
  stepsByDay: HomeChartPoint[];
}

function shortDayLabel(dateIso: string): string {
  const day = new Date(`${dateIso}T12:00:00`).getDay();
  return DAY_LABELS[day] ?? "?";
}

function lastNDays(count: number, endDate = todayLocalIsoDate()): string[] {
  const days: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    days.push(addDaysIso(endDate, -offset));
  }
  return days;
}

export function buildSessionsByDay(
  sessions: WorkoutSessionRecord[],
  days = 7,
  endDate = todayLocalIsoDate()
): HomeChartPoint[] {
  const range = lastNDays(days, endDate);
  const rangeSet = new Set(range);
  const counts = new Map<string, number>();

  for (const session of sessions) {
    if (session.status !== "completed") continue;
    const date = (session.completedAt ?? session.startedAt).slice(0, 10);
    if (!rangeSet.has(date)) continue;
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  return range.map((date) => ({
    date,
    label: shortDayLabel(date),
    value: counts.get(date) ?? 0,
  }));
}

export function buildWeightByDay(
  measurements: BodyMeasurementRow[],
  days = 7,
  endDate = todayLocalIsoDate()
): { points: HomeWeightPoint[]; deltaKg: number | null } {
  const range = lastNDays(days, endDate);
  const byDate = new Map(
    measurements.map((row) => [row.measuredDate, row.weightKg])
  );

  const points = range.map((date) => ({
    date,
    label: shortDayLabel(date),
    weightKg: byDate.get(date) ?? null,
  }));

  const withWeight = points.filter((point) => point.weightKg != null);
  let deltaKg: number | null = null;
  if (withWeight.length >= 2) {
    const first = withWeight[0]!.weightKg!;
    const last = withWeight[withWeight.length - 1]!.weightKg!;
    deltaKg = Math.round((last - first) * 10) / 10;
  }

  return { points, deltaKg };
}

export function buildStepsByDay(
  series: DailyActivityLog[],
  days = 7,
  endDate = todayLocalIsoDate()
): HomeChartPoint[] {
  const range = lastNDays(days, endDate);
  const byDate = new Map(series.map((log) => [log.activityDate, log.steps]));

  return range.map((date) => ({
    date,
    label: shortDayLabel(date),
    value: byDate.get(date) ?? null,
  }));
}
