import { getActivityContext } from "@/lib/activity/service";
import { getSleepContext } from "@/lib/sleep/service";
import { getGamificationContext } from "@/lib/coaching/service";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { getDailyNutritionSummary } from "@/lib/nutrition/service";
import { scheduleFitbitBackgroundSync } from "@/lib/integrations/fitbit-sync-scheduler";
import { ensureActiveProgram } from "@/lib/programs/service";
import type { FitnessGoal } from "@/lib/types/profile";
import { listWorkoutScheduleOverrides } from "@/lib/workouts/schedule-overrides-server";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
import {
  birthdayGreeting,
  isBirthdayToday,
  profileFirstName,
} from "@/lib/profile/identity";
import type { HomeDashboardData } from "./types";
import {
  buildSessionsByDay,
  buildStepsByDay,
  buildWeightByDay,
} from "./chart-snapshots";
import { buildHomeHeroContext } from "./hero-context";
import { computeWeeklyWorkStats } from "./weekly-stats";
import { getWeighInReminderForUser } from "@/lib/measurements/weigh-in-reminder-service";
import type { BodyMeasurementRow } from "@/lib/measurements/types";
import { addDaysIso, todayLocalIsoDate } from "@/lib/datetime/local-date";
import { getUserTimeZone } from "@/lib/datetime/timezone";
import { createClient } from "@/lib/supabase/server";
import { pickEncouragement } from "./encouragement";

function mapBodyMeasurementRow(row: Record<string, unknown>): BodyMeasurementRow {
  return {
    id: row.id as string,
    measuredDate: row.measured_date as string,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
    waistCm: row.waist_cm != null ? Number(row.waist_cm) : null,
    chestCm: row.chest_cm != null ? Number(row.chest_cm) : null,
    armsCm: row.arms_cm != null ? Number(row.arms_cm) : null,
    legsCm: row.legs_cm != null ? Number(row.legs_cm) : null,
    neckCm: row.neck_cm != null ? Number(row.neck_cm) : null,
    hipsCm: row.hips_cm != null ? Number(row.hips_cm) : null,
    bodyFatPct: row.body_fat_pct != null ? Number(row.body_fat_pct) : null,
    notes: (row.notes as string | null) ?? null,
  };
}

async function getRecentBodyMeasurements(
  userId: string,
  days = 14
): Promise<BodyMeasurementRow[]> {
  const supabase = await createClient();
  const timeZone = await getUserTimeZone();
  const endDate = todayLocalIsoDate(new Date(), timeZone);
  const startDate = addDaysIso(endDate, -(days - 1));

  const { data, error } = await supabase
    .from("body_measurements")
    .select(
      "id, measured_date, weight_kg, waist_cm, chest_cm, arms_cm, legs_cm, neck_cm, hips_cm, body_fat_pct, notes"
    )
    .eq("user_id", userId)
    .gte("measured_date", startDate)
    .lte("measured_date", endDate)
    .order("measured_date", { ascending: true });

  if (error) {
    if (
      error.code === "PGRST205" ||
      error.message?.toLowerCase().includes("body_measurements")
    ) {
      return [];
    }
    console.error("home body measurements lookup failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapBodyMeasurementRow(row as Record<string, unknown>)
  );
}

export async function getHomeDashboardData(
  userId: string
): Promise<HomeDashboardData> {
  const supabase = await createClient();

  const subscription = await getSubscriptionForUser(userId);
  await scheduleFitbitBackgroundSync(userId, subscription);

  const [profileResult, plan, nutrition, sessionResult, activity, sleep, recentMeasurements, scheduleOverridesResult] =
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
      getRecentBodyMeasurements(userId),
      listWorkoutScheduleOverrides(userId),
    ]);

  const gamification = await getGamificationContext(
    userId,
    subscription,
    sessionResult.records
  );

  const profile = profileResult.data;
  const goal = (profile?.primary_goal as FitnessGoal | null) ?? null;
  const weighInReminder = await getWeighInReminderForUser(userId, goal);
  const weeklyStats = computeWeeklyWorkStats(
    sessionResult.records,
    plan
  );

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

  const hero = buildHomeHeroContext(
    plan,
    sessionResult.records,
    weeklyStats,
    nutrition,
    new Date(),
    scheduleOverridesResult.overrides
  );
  const weightChart = buildWeightByDay(recentMeasurements);
  const charts = {
    sessionsByDay: buildSessionsByDay(sessionResult.records),
    weightByDay: weightChart.points,
    weightDeltaKg: weightChart.deltaKg,
    stepsByDay: buildStepsByDay(activity.series),
  };

  return {
    displayName: firstName ?? profile?.display_name ?? null,
    goal,
    whyStarted: profile?.why_started ?? null,
    plan,
    nutrition,
    weeklyStats,
    encouragement: pickEncouragement({
      goal,
      displayName: firstName ?? profile?.display_name ?? null,
      weekly: weeklyStats,
      proteinLoggedG: nutrition.totals.proteinG,
      proteinTargetG: nutrition.targets?.proteinG ?? null,
      whyStarted: profile?.why_started ?? null,
    }),
    birthdayMessage,
    workoutsTableReady: sessionResult.tableReady,
    activity,
    sleep,
    gamification,
    weighInReminder,
    hero,
    charts,
  };
}
