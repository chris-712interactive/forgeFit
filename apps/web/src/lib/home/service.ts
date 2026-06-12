import { buildProAnalyticsBundle } from "@/lib/analytics/service";
import { getActivityContext } from "@/lib/activity/service";
import { getGamificationContext } from "@/lib/coaching/service";
import type { ActivityContext } from "@/lib/activity/types";
import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasProAccess } from "@/lib/billing/types";
import { getDailyNutritionSummary } from "@/lib/nutrition/service";
import { getPromotionEvaluation } from "@/lib/progression/service";
import { ensureActiveProgram } from "@/lib/programs/service";
import type { FitnessGoal } from "@/lib/types/profile";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
import { pickEncouragement } from "./encouragement";
import type { HomeDashboardData } from "./types";
import {
  computeWeeklyWorkStats,
  findNextPlannedSession,
} from "./weekly-stats";
import { createClient } from "@/lib/supabase/server";

export async function getHomeDashboardData(
  userId: string
): Promise<HomeDashboardData> {
  const supabase = await createClient();

  const subscriptionPromise = getSubscriptionForUser(userId);

  const [profileResult, plan, nutrition, sessionResult, subscription, activity] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name, primary_goal, why_started, sessions_per_week, minutes_per_session"
        )
        .eq("id", userId)
        .single(),
      ensureActiveProgram(userId),
      getDailyNutritionSummary(userId),
      getServerSessionRecords(userId, 120),
      subscriptionPromise,
      subscriptionPromise.then((sub) => getActivityContext(userId, sub)),
    ]);

  const gamification = await getGamificationContext(
    userId,
    subscription,
    sessionResult.records
  );

  const profile = profileResult.data;
  const weeklyStats = computeWeeklyWorkStats(
    sessionResult.records,
    plan
  );
  const next = findNextPlannedSession(sessionResult.records, plan);
  const promotion = await getPromotionEvaluation(
    userId,
    sessionResult.records,
    plan
  );

  let proInsights: HomeDashboardData["proInsights"] = [];
  if (
    hasProAccess(subscription) &&
    hasFeature(subscription, "rule_based_insights")
  ) {
    const bundle = await buildProAnalyticsBundle(userId, subscription);
    proInsights = bundle.insights;
  }

  return {
    displayName: profile?.display_name ?? null,
    goal: (profile?.primary_goal as FitnessGoal | null) ?? null,
    whyStarted: profile?.why_started ?? null,
    plan,
    nutrition,
    weeklyStats,
    encouragement: pickEncouragement({
      goal: (profile?.primary_goal as FitnessGoal | null) ?? null,
      displayName: profile?.display_name ?? null,
      weekly: weeklyStats,
      proteinLoggedG: nutrition.totals.proteinG,
      proteinTargetG: nutrition.targets?.proteinG ?? null,
      whyStarted: profile?.why_started ?? null,
    }),
    nextSessionDayIndex: next?.dayIndex ?? null,
    nextSessionName: next?.name ?? null,
    workoutsTableReady: sessionResult.tableReady,
    promotion,
    proInsights,
    activity,
    gamification,
  };
}
