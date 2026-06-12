import type { RuleInsight } from "@/lib/analytics/types";
import type { ActivityContext } from "@/lib/activity/types";
import type { DailyNutritionSummary } from "@/lib/nutrition/types";
import type { ProgramPlan } from "@forgefit/program-engine";
import type { PromotionEvaluation } from "@/lib/progression/types";
import type { FitnessGoal } from "@/lib/types/profile";

export interface WeeklyWorkStats {
  workoutsCompleted: number;
  workoutsPlanned: number;
  totalVolumeKg: number;
  totalSets: number;
  cardioMinutes: number;
  estimatedDistanceMiles: number;
  recoveryMinutes: number;
  trainingMinutes: number;
}

export interface HomeDashboardData {
  displayName: string | null;
  goal: FitnessGoal | null;
  whyStarted: string | null;
  plan: ProgramPlan | null;
  nutrition: DailyNutritionSummary;
  weeklyStats: WeeklyWorkStats;
  encouragement: string;
  nextSessionDayIndex: number | null;
  nextSessionName: string | null;
  workoutsTableReady: boolean;
  promotion: PromotionEvaluation | null;
  proInsights: RuleInsight[];
  activity: ActivityContext;
}
