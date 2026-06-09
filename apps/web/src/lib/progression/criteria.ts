import type { ExperienceLevel } from "@/lib/types/profile";

export interface PromotionTierCriteria {
  from: ExperienceLevel;
  to: ExperienceLevel;
  lookbackWeeks: number;
  minWeeksPassing: number;
  weeklyAdherencePct: number;
  minTotalSessions: number;
  minSetCompletionPct: number;
  evidenceRuleId: string;
  headlineReady: string;
  headlineProgress: string;
}

export const PROMOTION_TIERS: PromotionTierCriteria[] = [
  {
    from: "beginner",
    to: "intermediate",
    lookbackWeeks: 4,
    minWeeksPassing: 3,
    weeklyAdherencePct: 0.75,
    minTotalSessions: 10,
    minSetCompletionPct: 0.5,
    evidenceRuleId: "experience_promotion_beginner",
    headlineReady: "You're ready for intermediate training",
    headlineProgress: "Path to intermediate",
  },
  {
    from: "intermediate",
    to: "advanced",
    lookbackWeeks: 8,
    minWeeksPassing: 6,
    weeklyAdherencePct: 0.8,
    minTotalSessions: 28,
    minSetCompletionPct: 0.6,
    evidenceRuleId: "experience_promotion_intermediate",
    headlineReady: "You're ready for advanced training",
    headlineProgress: "Path to advanced",
  },
];

export function criteriaForLevel(
  level: ExperienceLevel
): PromotionTierCriteria | null {
  return PROMOTION_TIERS.find((tier) => tier.from === level) ?? null;
}
