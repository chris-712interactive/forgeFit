import type {
  TrendSeries,
  WeightProjectionResult,
} from "@forgefit/projection-engine";
import type { FitnessGoal } from "@forgefit/program-engine";

export interface BodyMeasurementRow {
  id: string;
  measuredDate: string;
  weightKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armsCm: number | null;
  legsCm: number | null;
  neckCm: number | null;
  hipsCm: number | null;
  bodyFatPct: number | null;
  notes: string | null;
}

export interface CaliperMeasurementRow {
  id: string;
  measuredDate: string;
  formula: "jp3" | "jp7";
  bodyFatPct: number;
  sumMm: number;
}

export interface ProgressDashboardData {
  goal: FitnessGoal | null;
  age: number | null;
  sex: string | null;
  measurements: BodyMeasurementRow[];
  caliperEntries: CaliperMeasurementRow[];
  trends: TrendSeries[];
  projection: WeightProjectionResult | null;
  tableReady: boolean;
}
