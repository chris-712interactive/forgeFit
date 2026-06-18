import { buildProAnalyticsBundle } from "@/lib/analytics/service";
import { getActivityContext } from "@/lib/activity/service";
import { getRecoveryContext } from "@/lib/recovery/service";
import { getSleepContext } from "@/lib/sleep/service";
import { getGamificationContext } from "@/lib/coaching/service";
import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasProAccess } from "@/lib/billing/types";
import { getDailyNutritionSummary } from "@/lib/nutrition/service";
import { scheduleFitbitBackgroundSync } from "@/lib/integrations/fitbit-sync-scheduler";
import { ensureActiveProgram } from "@/lib/programs/service";
import type { FitnessGoal } from "@/lib/types/profile";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
import {
  birthdayGreeting,
  isBirthdayToday,
  profileFirstName,
} from "@/lib/profile/identity";
import type { HomeDashboardData } from "./types";
import {
  computeWeeklyWorkStats,
  findNextPlannedSession,
} from "./weekly-stats";
import { createClient } from "@/lib/supabase/server";
import { pickEncouragement } from "./encouragement";

export async function getHomeDashboardData(
  userId: string
): Promise<HomeDashboardData> {
  const supabase = await createClient();

  const subscription = await getSubscriptionForUser(userId);
  scheduleFitbitBackgroundSync(userId, subscription);

  const needsProAnalytics =
    hasProAccess(subscription) &&
    hasFeature(subscription, "rule_based_insights");

  const [profileResult, plan, nutrition, sessionResult, activity, sleep, recovery] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name, first_name, last_name, date_of_birth, primary_goal, why_started, sessions_per_week, minutes_per_session"
        )
        .eq("id", userId)
        .single(),
      ensureActiveProgram(userId),
      getDailyNutritionSummary(userId),
      getServerSessionRecords(userId, 120),
      getActivityContext(userId, subscription),
      getSleepContext(userId, subscription),
      needsProAnalytics
        ? getRecoveryContext(userId, subscription)
        : Promise.resolve(null),
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

  let proInsights: HomeDashboardData["proInsights"] = [];
  let weeklyScorecard: HomeDashboardData["weeklyScorecard"] = null;
  if (needsProAnalytics) {
    const bundle = await buildProAnalyticsBundle(userId, subscription, {
      activity,
      sleep,
      recovery,
    });
    proInsights = bundle.insights;
    weeklyScorecard = bundle.scorecard;
  }

  const firstName = profile
    ? profileFirstName({
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: profile.display_name,
      })
    : null;
  const birthdayMessage =
    profile?.date_of_birth && isBirthdayToday(profile.date_of_birth)
      ? birthdayGreeting(firstName)
      : null;

  return {
    displayName: firstName ?? profile?.display_name ?? null,
    goal: (profile?.primary_goal as FitnessGoal | null) ?? null,
    whyStarted: profile?.why_started ?? null,
    plan,
    nutrition,
    weeklyStats,
    encouragement: pickEncouragement({
      goal: (profile?.primary_goal as FitnessGoal | null) ?? null,
      displayName: firstName ?? profile?.display_name ?? null,
      weekly: weeklyStats,
      proteinLoggedG: nutrition.totals.proteinG,
      proteinTargetG: nutrition.targets?.proteinG ?? null,
      whyStarted: profile?.why_started ?? null,
    }),
    birthdayMessage,
    nextSessionDayIndex: next?.dayIndex ?? null,
    nextSessionName: next?.name ?? null,
    workoutsTableReady: sessionResult.tableReady,
    proInsights,
    weeklyScorecard,
    activity,
    sleep,
    gamification,
  };
}
