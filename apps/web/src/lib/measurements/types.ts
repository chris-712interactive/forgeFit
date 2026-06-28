import type {
  WaistProjectionResult,
  WeightProjectionResult,
} from "@forgefit/projection-engine";
import type { FitnessGoal } from "@forgefit/program-engine";
import type { ActivityContext } from "@/lib/activity/types";
import type { SleepContext } from "@/lib/sleep/types";
import type { RecoveryContext } from "@/lib/recovery/types";
import type { ProAnalyticsBundle } from "@/lib/analytics/types";
import type { SubscriptionSnapshot } from "@/lib/billing/types";
import type { WeighInReminder } from "@/lib/measurements/weigh-in-reminder";
import type { ProgressPhotoRow } from "@/lib/progress-photos/types";

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

export interface ProgressGateContext {
  subscription: SubscriptionSnapshot;
  horizonDays: number;
  showConfidenceBands: boolean;
  showGoalDate: boolean;
  showWaistProjection: boolean;
  analyticsHistoryDays: number | null;
}

export interface ProgressDashboardData {
  goal: FitnessGoal | null;
  age: number | null;
  sex: string | null;
  measurements: BodyMeasurementRow[];
  caliperEntries: CaliperMeasurementRow[];
  projection: WeightProjectionResult | null;
  waistProjection: WaistProjectionResult | null;
  hasWaistHistory: boolean;
  tableReady: boolean;
  gates: ProgressGateContext;
  proAnalytics: ProAnalyticsBundle | null;
  progressPhotos: ProgressPhotoRow[];
  photosTableReady: boolean;
  activity: ActivityContext;
  sleep: SleepContext;
  recovery: RecoveryContext;
  weighInReminder: WeighInReminder | null;
}
