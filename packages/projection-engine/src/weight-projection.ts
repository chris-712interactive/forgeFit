import type { FitnessGoal } from "@forgefit/program-engine";
import type {
  ProjectionPoint,
  WeightDataPoint,
  WeightProjectionInput,
  WeightProjectionResult,
} from "./types";

const MS_PER_DAY = 86_400_000;

function parseDate(date: string): number {
  return new Date(`${date}T12:00:00Z`).getTime();
}

function formatDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return (parseDate(b) - parseDate(a)) / MS_PER_DAY;
}

function addDays(date: string, days: number): string {
  return formatDate(parseDate(date) + days * MS_PER_DAY);
}

interface GoalRate {
  weeklyPct: number;
  ruleId: string;
}

function goalRate(goal: FitnessGoal): GoalRate {
  switch (goal) {
    case "fat_loss":
      return { weeklyPct: -0.75, ruleId: "fat_loss_rate" };
    case "recomposition":
      return { weeklyPct: -0.35, ruleId: "fat_loss_rate" };
    case "bodybuilding":
      return { weeklyPct: 0.35, ruleId: "hypertrophy_rate" };
    case "powerlifting":
    case "general_strength":
      return { weeklyPct: 0.15, ruleId: "hypertrophy_rate" };
  }
}

function linearSlopeKgPerDay(points: WeightDataPoint[]): number | null {
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
    const y = point.weightKg;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return null;

  return (n * sumXY - sumX * sumY) / denominator;
}

function clampWeeklyChange(
  weeklyKg: number,
  currentWeightKg: number,
  goal: FitnessGoal
): { weeklyKg: number; weeklyPct: number; ruleId: string } {
  const { weeklyPct: targetPct, ruleId } = goalRate(goal);
  const observedPct = (weeklyKg / currentWeightKg) * 100;

  const maxLoss = -1.0;
  const maxGain = 0.5;
  const clampedPct = Math.max(maxLoss, Math.min(maxGain, observedPct));

  const isLossGoal = targetPct < 0;
  const isGainGoal = targetPct > 0;

  let adjustedPct = clampedPct;
  if (isLossGoal && adjustedPct > 0) adjustedPct = targetPct;
  if (isGainGoal && adjustedPct < 0) adjustedPct = targetPct;

  if (Math.abs(adjustedPct) < Math.abs(targetPct) * 0.25) {
    adjustedPct = targetPct;
  }

  return {
    weeklyKg: (adjustedPct / 100) * currentWeightKg,
    weeklyPct: adjustedPct,
    ruleId,
  };
}

export function projectWeight({
  history,
  goal,
  age: _age,
  horizonDays = 30,
}: WeightProjectionInput): WeightProjectionResult {
  const sorted = [...history]
    .filter((point) => point.weightKg > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    throw new Error("At least one weight measurement is required");
  }

  const latest = sorted[sorted.length - 1]!;
  const slope = linearSlopeKgPerDay(sorted);
  const { weeklyPct, ruleId } = goalRate(goal);

  let weeklyChangeKg: number;
  if (slope == null || sorted.length < 2) {
    weeklyChangeKg = (weeklyPct / 100) * latest.weightKg;
  } else {
    const spanDays = Math.max(1, daysBetween(sorted[0]!.date, latest.date));
    const observedWeeklyKg = slope * 7;
    const blended =
      sorted.length >= 4
        ? observedWeeklyKg * 0.7 + ((weeklyPct / 100) * latest.weightKg) * 0.3
        : observedWeeklyKg * 0.4 + ((weeklyPct / 100) * latest.weightKg) * 0.6;

    const clamped = clampWeeklyChange(blended, latest.weightKg, goal);
    weeklyChangeKg = clamped.weeklyKg;
  }

  const dailyChangeKg = weeklyChangeKg / 7;
  const historical: ProjectionPoint[] = sorted.map((point) => ({
    date: point.date,
    weightKg: point.weightKg,
    projected: false,
  }));

  const projected: ProjectionPoint[] = [];
  for (let day = 1; day <= horizonDays; day += 1) {
    const date = addDays(latest.date, day);
    projected.push({
      date,
      weightKg:
        Math.round((latest.weightKg + dailyChangeKg * day) * 10) / 10,
      projected: true,
    });
  }

  return {
    horizonDays,
    weeklyChangePct:
      Math.round(((weeklyChangeKg / latest.weightKg) * 100) * 100) / 100,
    weeklyChangeKg: Math.round(weeklyChangeKg * 100) / 100,
    points: [...historical, ...projected],
    ruleId,
  };
}
