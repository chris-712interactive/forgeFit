import type { ExperienceLevel } from "@/lib/types/profile";

export interface WeeklyAdherence {
  weekStartIso: string;
  completed: number;
  planned: number;
  rate: number;
  meetsThreshold: boolean;
}

export interface PromotionProgress {
  lookbackWeeks: number;
  weeksMeetingThreshold: number;
  requiredWeeks: number;
  adherenceThresholdPct: number;
  totalQualitySessions: number;
  requiredSessions: number;
  weeklyAdherence: WeeklyAdherence[];
}

export interface PromotionEvaluation {
  currentLevel: ExperienceLevel;
  nextLevel: ExperienceLevel | null;
  eligible: boolean;
  showNudge: boolean;
  progress: PromotionProgress | null;
  headline: string;
  detail: string;
  evidenceRuleId: string;
}

export interface PromotionProfileMeta {
  experienceLevel: ExperienceLevel;
  promotionSnoozedUntil: string | null;
}
