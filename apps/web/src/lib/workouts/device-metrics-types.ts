export type DeviceMatchConfidence = "high" | "medium" | "low" | "none";
export type IntensityBand = "low" | "moderate" | "high";
export type IntensityVerdict =
  | "on_target"
  | "too_easy"
  | "too_hard"
  | "inconclusive";
export type RirAgreement =
  | "aligned"
  | "harder_than_logged"
  | "easier_than_logged";

export interface WorkoutDeviceMetricsRecord {
  workoutSessionId: string;
  clientId: string;
  source: string;
  externalExerciseId: string | null;
  overlapRatio: number | null;
  matchConfidence: DeviceMatchConfidence;
  avgHeartRateBpm: number | null;
  activeZoneMinutes: number | null;
  caloriesKcal: number | null;
  zoneLightSeconds: number | null;
  zoneFatBurnSeconds: number | null;
  zoneCardioSeconds: number | null;
  zonePeakSeconds: number | null;
  exerciseType: string | null;
  displayName: string | null;
  loggedAvgRir: number | null;
  loggedHardSets: number | null;
  intensityBand: IntensityBand | null;
  intensityVerdict: IntensityVerdict;
  rirAgreement: RirAgreement | null;
  evidenceRuleId: string | null;
  updatedAt: string;
}

export interface WorkoutReadinessContext {
  unlocked: boolean;
  fitbitConnected: boolean;
  status: "ready" | "caution" | "recovery_day";
  message: string;
}

export interface SessionIntensitySummary {
  sessionsOnTarget: number;
  sessionsWithMetrics: number;
  sessionsTooEasy: number;
  sessionsTooHard: number;
  sessionsHarderThanLogged: number;
}
