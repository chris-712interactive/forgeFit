import type { FitnessGoal } from "@forgefit/program-engine";

export type CaliperFormula = "jp3" | "jp7";

export type CaliperSex = "male" | "female";

export interface CaliperSkinfoldsMm {
  chest?: number;
  abdominal?: number;
  thigh?: number;
  tricep?: number;
  suprailiac?: number;
  midaxillary?: number;
  subscapular?: number;
}

export interface CaliperResult {
  formula: CaliperFormula;
  sumMm: number;
  bodyFatPct: number;
  bodyDensity: number;
}

export interface WeightDataPoint {
  date: string;
  weightKg: number;
}

export interface ProjectionPoint {
  date: string;
  weightKg: number;
  projected: boolean;
}

export interface WeightProjectionInput {
  history: WeightDataPoint[];
  goal: FitnessGoal;
  age: number;
  horizonDays?: number;
  effectiveDeficitKcal?: number;
  effectiveSurplusKcal?: number;
  trainingKcalPerDay?: number;
}

export interface WeightProjectionResult {
  horizonDays: number;
  weeklyChangePct: number;
  weeklyChangeKg: number;
  points: ProjectionPoint[];
  ruleId: string;
  effectiveDeficitKcal?: number;
  effectiveSurplusKcal?: number;
  trainingKcalPerDay?: number;
}

export type MeasurementMetric =
  | "weightKg"
  | "waistCm"
  | "chestCm"
  | "armsCm"
  | "legsCm"
  | "neckCm"
  | "hipsCm"
  | "bodyFatPct";

export interface TrendSeries {
  metric: MeasurementMetric;
  label: string;
  unit: string;
  points: { date: string; value: number }[];
}
