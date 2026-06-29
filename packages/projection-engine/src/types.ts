import type { FatLossPace, FitnessGoal, RecompPriority } from "@forgefit/program-engine";

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
  /** Evidence min/max band (Pro) — only on projected points when enabled */
  bandLowKg?: number;
  bandHighKg?: number;
}

export interface WeightProjectionInput {
  history: WeightDataPoint[];
  goal: FitnessGoal;
  age: number;
  horizonDays?: number;
  effectiveDeficitKcal?: number;
  effectiveSurplusKcal?: number;
  trainingKcalPerDay?: number;
  fatLossPace?: FatLossPace;
  recompPriority?: RecompPriority;
  goalWeightKg?: number;
  /** When true, adds bandLowKg/bandHighKg from evidence min/max weekly rates */
  includeConfidenceBand?: boolean;
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
  goalWeightKg?: number;
  /** ISO date when projected weight reaches goalWeightKg (Pro goal-date feature). */
  goalReachDate?: string;
  daysToGoal?: number;
}

export interface WaistDataPoint {
  date: string;
  waistCm: number;
}

export interface WaistProjectionPoint {
  date: string;
  waistCm: number;
  projected: boolean;
}

export interface WaistProjectionInput {
  history: WaistDataPoint[];
  horizonDays?: number;
  goal?: FitnessGoal;
}

export interface WaistProjectionResult {
  horizonDays: number;
  weeklyChangeCm: number;
  points: WaistProjectionPoint[];
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
