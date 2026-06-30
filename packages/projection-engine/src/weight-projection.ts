import type { FatLossPace, FitnessGoal, RecompPriority } from "@forgefit/program-engine";
import type {
  ProjectionPoint,
  WeightDataPoint,
  WeightProjectionInput,
  WeightProjectionResult,
} from "./types";

const MS_PER_DAY = 86_400_000;
const KCAL_PER_KG_FAT = 7700;

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
  minWeeklyPct: number;
  maxWeeklyPct: number;
}

interface GoalRateOptions {
  fatLossPace?: FatLossPace;
  recompPriority?: RecompPriority;
}

function goalRate(goal: FitnessGoal, options: GoalRateOptions = {}): GoalRate {
  switch (goal) {
    case "fat_loss": {
      const pace = options.fatLossPace ?? "moderate";
      const weeklyByPace: Record<FatLossPace, number> = {
        steady: -0.5,
        moderate: -0.75,
        aggressive: -1.0,
      };
      return {
        weeklyPct: weeklyByPace[pace],
        minWeeklyPct: -1.0,
        maxWeeklyPct: -0.5,
        ruleId: "fat_loss_rate",
      };
    }
    case "recomposition": {
      const priority = options.recompPriority ?? "balanced";
      const weeklyByPriority: Record<RecompPriority, number> = {
        muscle: -0.25,
        balanced: -0.35,
        lean_out: -0.5,
      };
      return {
        weeklyPct: weeklyByPriority[priority],
        minWeeklyPct: -1.0,
        maxWeeklyPct: -0.25,
        ruleId: "fat_loss_rate",
      };
    }
    case "bodybuilding":
      return {
        weeklyPct: 0.35,
        minWeeklyPct: 0.15,
        maxWeeklyPct: 0.5,
        ruleId: "lean_gain_rate",
      };
    case "powerlifting":
    case "general_strength":
    case "sport_performance":
      return {
        weeklyPct: 0.15,
        minWeeklyPct: 0.1,
        maxWeeklyPct: 0.5,
        ruleId: "lean_gain_rate",
      };
  }
}

function energyBalanceWeeklyKg(
  goal: FitnessGoal,
  currentWeightKg: number,
  effectiveDeficitKcal?: number,
  effectiveSurplusKcal?: number
): number | null {
  const isLossGoal = goal === "fat_loss" || goal === "recomposition";

  if (isLossGoal && effectiveDeficitKcal != null && effectiveDeficitKcal > 0) {
    return -((effectiveDeficitKcal * 7) / KCAL_PER_KG_FAT);
  }

  if (!isLossGoal && effectiveSurplusKcal != null && effectiveSurplusKcal > 0) {
    return (effectiveSurplusKcal * 7) / KCAL_PER_KG_FAT;
  }

  return null;
}

function deficitBasedPrior(
  goal: FitnessGoal,
  currentWeightKg: number,
  effectiveDeficitKcal?: number,
  effectiveSurplusKcal?: number,
  options: GoalRateOptions = {}
): { weeklyKg: number; weeklyPct: number; ruleId: string } {
  const rate = goalRate(goal, options);
  const energyBased = energyBalanceWeeklyKg(
    goal,
    currentWeightKg,
    effectiveDeficitKcal,
    effectiveSurplusKcal
  );

  let weeklyKg =
    energyBased ?? (rate.weeklyPct / 100) * currentWeightKg;

  const minKg = (rate.minWeeklyPct / 100) * currentWeightKg;
  const maxKg = (rate.maxWeeklyPct / 100) * currentWeightKg;

  if (weeklyKg < 0) {
    weeklyKg = Math.min(maxKg, Math.max(minKg, weeklyKg));
  } else {
    weeklyKg = Math.max(minKg, Math.min(maxKg, weeklyKg));
  }

  return {
    weeklyKg,
    weeklyPct: (weeklyKg / currentWeightKg) * 100,
    ruleId: energyBased != null ? "energy_balance_projection" : rate.ruleId,
  };
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
  goal: FitnessGoal,
  options: GoalRateOptions = {}
): { weeklyKg: number; weeklyPct: number; ruleId: string } {
  const rate = goalRate(goal, options);
  const observedPct = (weeklyKg / currentWeightKg) * 100;

  const maxLoss = rate.minWeeklyPct;
  const maxGain = rate.maxWeeklyPct;
  const clampedPct = Math.max(maxLoss, Math.min(maxGain, observedPct));

  const isLossGoal = rate.weeklyPct < 0;
  const isGainGoal = rate.weeklyPct > 0;

  let adjustedPct = clampedPct;
  if (isLossGoal && adjustedPct > 0) adjustedPct = rate.weeklyPct;
  if (isGainGoal && adjustedPct < 0) adjustedPct = rate.weeklyPct;

  if (Math.abs(adjustedPct) < Math.abs(rate.weeklyPct) * 0.25) {
    adjustedPct = rate.weeklyPct;
  }

  return {
    weeklyKg: (adjustedPct / 100) * currentWeightKg,
    weeklyPct: adjustedPct,
    ruleId: rate.ruleId,
  };
}

export function projectWeight({
  history,
  goal,
  age: _age,
  horizonDays = 30,
  effectiveDeficitKcal,
  effectiveSurplusKcal,
  trainingKcalPerDay,
  fatLossPace,
  recompPriority,
  goalWeightKg,
  includeConfidenceBand = false,
}: WeightProjectionInput): WeightProjectionResult {
  const rateOptions: GoalRateOptions = { fatLossPace, recompPriority };
  const sorted = [...history]
    .filter((point) => point.weightKg > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    throw new Error("At least one weight measurement is required");
  }

  const latest = sorted[sorted.length - 1]!;
  const slope = linearSlopeKgPerDay(sorted);
  const prior = deficitBasedPrior(
    goal,
    latest.weightKg,
    effectiveDeficitKcal,
    effectiveSurplusKcal,
    rateOptions
  );

  let weeklyChangeKg: number;
  let ruleId = prior.ruleId;

  if (slope == null || sorted.length < 2) {
    weeklyChangeKg = prior.weeklyKg;
  } else {
    const observedWeeklyKg = slope * 7;
    const blended =
      sorted.length >= 4
        ? observedWeeklyKg * 0.7 + prior.weeklyKg * 0.3
        : observedWeeklyKg * 0.4 + prior.weeklyKg * 0.6;

    const clamped = clampWeeklyChange(blended, latest.weightKg, goal, rateOptions);
    weeklyChangeKg = clamped.weeklyKg;
    if (prior.ruleId === "energy_balance_projection") {
      ruleId = prior.ruleId;
    } else {
      ruleId = clamped.ruleId;
    }
  }

  const dailyChangeKg = weeklyChangeKg / 7;
  const rate = goalRate(goal, rateOptions);
  const bandLowDailyKg = (rate.minWeeklyPct / 100) * latest.weightKg / 7;
  const bandHighDailyKg = (rate.maxWeeklyPct / 100) * latest.weightKg / 7;

  const historical: ProjectionPoint[] = sorted.map((point) => ({
    date: point.date,
    weightKg: point.weightKg,
    projected: false,
  }));

  const projected: ProjectionPoint[] = [];
  for (let day = 1; day <= horizonDays; day += 1) {
    const date = addDays(latest.date, day);
    const point: ProjectionPoint = {
      date,
      weightKg:
        Math.round((latest.weightKg + dailyChangeKg * day) * 10) / 10,
      projected: true,
    };

    if (includeConfidenceBand) {
      point.bandLowKg =
        Math.round((latest.weightKg + bandLowDailyKg * day) * 10) / 10;
      point.bandHighKg =
        Math.round((latest.weightKg + bandHighDailyKg * day) * 10) / 10;
    }

    projected.push(point);
  }

  let goalReachDate: string | undefined;
  let daysToGoal: number | undefined;

  if (
    goalWeightKg != null &&
    goalWeightKg > 0 &&
    latest.weightKg > goalWeightKg &&
    dailyChangeKg < 0
  ) {
    const kgToLose = latest.weightKg - goalWeightKg;
    daysToGoal = Math.ceil(kgToLose / Math.abs(dailyChangeKg));
    goalReachDate = addDays(latest.date, daysToGoal);
  }

  return {
    horizonDays,
    weeklyChangePct:
      Math.round(((weeklyChangeKg / latest.weightKg) * 100) * 100) / 100,
    weeklyChangeKg: Math.round(weeklyChangeKg * 100) / 100,
    points: [...historical, ...projected],
    ruleId,
    effectiveDeficitKcal,
    effectiveSurplusKcal,
    trainingKcalPerDay,
    goalWeightKg,
    goalReachDate,
    daysToGoal,
  };
}
