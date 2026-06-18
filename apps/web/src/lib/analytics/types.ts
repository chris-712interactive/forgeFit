export interface StrengthDataPoint {
  date: string;
  e1rmKg: number;
}

export interface LiftStrengthSeries {
  exerciseId: string;
  label: string;
  points: StrengthDataPoint[];
}

export interface PrRecord {
  exerciseId: string;
  exerciseName: string;
  label: string;
  date: string;
  weightKg: number;
  reps: number;
  e1rmKg: number;
}

export interface WeeklyVolumePoint {
  weekStart: string;
  volumeKg: number;
  sessions: number;
}

export interface MuscleVolumeSlice {
  muscle: string;
  volumeKg: number;
}

export interface NutritionDayAdherence {
  date: string;
  logged: boolean;
  proteinHit: boolean;
  calorieHit: boolean;
  proteinG: number;
  calories: number;
}

export interface NutritionAdherenceWindow {
  days: number;
  daysLogged: number;
  proteinHitDays: number;
  calorieHitDays: number;
  proteinHitPct: number;
  calorieHitPct: number;
}

export interface NutritionAdherenceSummary {
  targets: {
    proteinG: number;
    calories: number;
  } | null;
  windows: NutritionAdherenceWindow[];
  recentDays: NutritionDayAdherence[];
}

export type InsightTone = "positive" | "neutral" | "nudge";

export interface RuleInsight {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
}

export type ScorecardStatus = "good" | "watch" | "neutral";

export type ScorecardPillarId =
  | "training"
  | "protein"
  | "sleep"
  | "recovery"
  | "activity";

export interface ScorecardPillar {
  id: ScorecardPillarId;
  label: string;
  summary: string;
  status: ScorecardStatus;
  evidenceRuleId?: string;
}

export interface WeeklyScorecard {
  pillars: ScorecardPillar[];
  /** Short label for the top problem area, e.g. "Recovery debt". */
  headline: string | null;
  problemArea: ScorecardPillarId | null;
  evidenceRuleIds: string[];
}

export interface ProAnalyticsBundle {
  strengthSeries: LiftStrengthSeries[];
  prHistory: PrRecord[];
  weeklyVolume: WeeklyVolumePoint[];
  muscleVolume: MuscleVolumeSlice[];
  nutritionAdherence: NutritionAdherenceSummary | null;
  insights: RuleInsight[];
  scorecard: WeeklyScorecard;
}
