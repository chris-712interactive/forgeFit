import type { RuleInsight, WeeklyScorecard } from "@/lib/analytics/types";
import type { ActivityContext } from "@/lib/activity/types";
import type { SleepContext } from "@/lib/sleep/types";
import type { GamificationContext } from "@/lib/coaching/types";
import type { DailyNutritionSummary } from "@/lib/nutrition/types";
import type { ProgramPlan } from "@forgefit/program-engine";
import type { WeighInReminder } from "@/lib/measurements/weigh-in-reminder";
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
  proInsights: RuleInsight[];
  weeklyScorecard: WeeklyScorecard | null;
  birthdayMessage: string | null;
  activity: ActivityContext;
  sleep: SleepContext;
  gamification: GamificationContext;
  weighInReminder: WeighInReminder | null;
  isPro: boolean;
}
