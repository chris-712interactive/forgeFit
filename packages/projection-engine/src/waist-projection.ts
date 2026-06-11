import type { FitnessGoal } from "@forgefit/program-engine";
import type {
  WaistDataPoint,
  WaistProjectionInput,
  WaistProjectionPoint,
  WaistProjectionResult,
} from "./types";

const MS_PER_DAY = 86_400_000;
const MAX_WEEKLY_WAIST_CHANGE_CM = 1.5;

function parseDate(date: string): number {
  return new Date(`${date}T12:00:00Z`).getTime();
}

function formatDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  return formatDate(parseDate(date) + days * MS_PER_DAY);
}

function linearSlopeCmPerDay(points: WaistDataPoint[]): number | null {
  if (points.length < 2) return null;

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const n = sorted.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  const origin = parseDate(sorted[0]!.date);

  for (const point of sorted) {
    const x = (parseDate(point.date) - origin) / MS_PER_DAY;
    const y = point.waistCm;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return null;

  return (n * sumXY - sumX * sumY) / denominator;
}

function clampWeeklyWaistChange(
  weeklyCm: number,
  goal?: FitnessGoal
): number {
  let clamped = Math.max(
    -MAX_WEEKLY_WAIST_CHANGE_CM,
    Math.min(MAX_WEEKLY_WAIST_CHANGE_CM, weeklyCm)
  );

  if (goal === "fat_loss" || goal === "recomposition") {
    if (clamped > 0.25) {
      clamped = 0.25;
    }
  }

  return clamped;
}

export function projectWaist({
  history,
  horizonDays = 30,
  goal,
}: WaistProjectionInput): WaistProjectionResult | null {
  const sorted = [...history]
    .filter((point) => point.waistCm > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length < 2) {
    return null;
  }

  const latest = sorted[sorted.length - 1]!;
  const slope = linearSlopeCmPerDay(sorted);
  const observedWeeklyCm = (slope ?? 0) * 7;
  const weeklyChangeCm = clampWeeklyWaistChange(observedWeeklyCm, goal);
  const dailyChangeCm = weeklyChangeCm / 7;

  const historical: WaistProjectionPoint[] = sorted.map((point) => ({
    date: point.date,
    waistCm: point.waistCm,
    projected: false,
  }));

  const projected: WaistProjectionPoint[] = [];
  for (let day = 1; day <= horizonDays; day += 1) {
    projected.push({
      date: addDays(latest.date, day),
      waistCm: Math.round((latest.waistCm + dailyChangeCm * day) * 10) / 10,
      projected: true,
    });
  }

  return {
    horizonDays,
    weeklyChangeCm: Math.round(weeklyChangeCm * 100) / 100,
    points: [...historical, ...projected],
  };
}
