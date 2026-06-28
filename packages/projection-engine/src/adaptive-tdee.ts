export interface AdaptiveTdeeDailyIntake {
  date: string;
  calories: number;
}

export interface AdaptiveTdeeWeightPoint {
  date: string;
  weightKg: number;
}

export type AdaptiveTdeeConfidence = "low" | "medium" | "high";

export interface AdaptiveTdeeResult {
  estimatedTdeeKcal: number;
  confidence: AdaptiveTdeeConfidence;
  confidenceBandKcal: number;
  windowDays: number;
  avgIntakeKcal: number;
  weightChangeKg: number;
  weightSpanDays: number;
  daysLogged: number;
  weighIns: number;
  ruleId: "adaptive_tdee_estimate";
}

export interface InferAdaptiveTdeeOptions {
  windowDays?: number;
  minLoggedDays?: number;
  minWeightSpanDays?: number;
  minWeighIns?: number;
}

const KCAL_PER_KG_FAT = 7700;

function parseDateMs(date: string): number {
  return new Date(`${date}T12:00:00Z`).getTime();
}

function daysBetween(start: string, end: string): number {
  return Math.max(
    1,
    Math.round((parseDateMs(end) - parseDateMs(start)) / 86_400_000)
  );
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function windowStart(todayIso: string, windowDays: number): string {
  const ms = parseDateMs(todayIso) - (windowDays - 1) * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

function confidenceBandKcal(
  confidence: AdaptiveTdeeConfidence,
  loggingRate: number
): number {
  const base =
    confidence === "high" ? 120 : confidence === "medium" ? 180 : 250;
  const loggingPenalty = loggingRate < 0.6 ? 80 : loggingRate < 0.75 ? 40 : 0;
  return base + loggingPenalty;
}

function resolveConfidence(
  daysLogged: number,
  weighIns: number,
  weightSpanDays: number,
  windowDays: number
): AdaptiveTdeeConfidence | null {
  const loggingRate = daysLogged / windowDays;
  if (
    daysLogged < 14 ||
    weighIns < 2 ||
    weightSpanDays < 14 ||
    loggingRate < 0.45
  ) {
    return null;
  }

  if (
    daysLogged >= 21 &&
    weighIns >= 4 &&
    weightSpanDays >= 21 &&
    loggingRate >= 0.65
  ) {
    return "high";
  }

  if (daysLogged >= 14 && weighIns >= 3 && weightSpanDays >= 14) {
    return "medium";
  }

  return "low";
}

export function inferAdaptiveTdee(
  dailyIntake: AdaptiveTdeeDailyIntake[],
  weightPoints: AdaptiveTdeeWeightPoint[],
  todayIso: string,
  options: InferAdaptiveTdeeOptions = {}
): AdaptiveTdeeResult | null {
  const windowDays = options.windowDays ?? 28;
  const minLoggedDays = options.minLoggedDays ?? 14;
  const minWeightSpanDays = options.minWeightSpanDays ?? 14;
  const minWeighIns = options.minWeighIns ?? 2;
  const start = windowStart(todayIso, windowDays);

  const intakeInWindow = dailyIntake.filter(
    (row) => row.date >= start && row.date <= todayIso && row.calories > 0
  );
  const daysLogged = intakeInWindow.length;
  if (daysLogged < minLoggedDays) return null;

  const weights = weightPoints
    .filter(
      (point) =>
        point.date >= start &&
        point.date <= todayIso &&
        Number.isFinite(point.weightKg) &&
        point.weightKg > 0
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  if (weights.length < minWeighIns) return null;

  const first = weights[0];
  const last = weights[weights.length - 1];
  const weightSpanDays = daysBetween(first.date, last.date);
  if (weightSpanDays < minWeightSpanDays) return null;

  const avgIntakeKcal = Math.round(mean(intakeInWindow.map((row) => row.calories)));
  const weightChangeKg = last.weightKg - first.weightKg;
  const dailyEnergyBalance = (weightChangeKg * KCAL_PER_KG_FAT) / weightSpanDays;
  const estimatedTdeeKcal = Math.round(avgIntakeKcal - dailyEnergyBalance);

  const confidence = resolveConfidence(
    daysLogged,
    weights.length,
    weightSpanDays,
    windowDays
  );
  if (!confidence) return null;

  const loggingRate = daysLogged / windowDays;

  return {
    estimatedTdeeKcal: Math.max(800, estimatedTdeeKcal),
    confidence,
    confidenceBandKcal: confidenceBandKcal(confidence, loggingRate),
    windowDays,
    avgIntakeKcal,
    weightChangeKg: Math.round(weightChangeKg * 10) / 10,
    weightSpanDays,
    daysLogged,
    weighIns: weights.length,
    ruleId: "adaptive_tdee_estimate",
  };
}
