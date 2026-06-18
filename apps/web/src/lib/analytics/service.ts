import { analyticsHistoryCutoff, hasFeature } from "@/lib/billing/gates";
import type { SubscriptionSnapshot } from "@/lib/billing/types";
import { getSleepContext } from "@/lib/sleep/service";
import { getRecoveryContext } from "@/lib/recovery/service";
import { getActivityContext } from "@/lib/activity/service";
import { getActiveProgram } from "@/lib/programs/service";
import { createClient } from "@/lib/supabase/server";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
import { buildNutritionAdherence } from "./nutrition-adherence";
import { buildPrHistory } from "./pr-history";
import { buildRuleInsights } from "./insights";
import { buildStrengthSeries } from "./strength";
import { buildMuscleVolumeSlices, buildWeeklyVolumeTrend } from "./volume";
import type { ProAnalyticsBundle } from "./types";

async function loadNutritionDailyTotals(
  userId: string,
  cutoffIso: string | null
): Promise<{ date: string; calories: number; proteinG: number }[]> {
  const supabase = await createClient();
  let query = supabase
    .from("nutrition_logs")
    .select("logged_date, calories, protein_g")
    .eq("user_id", userId);

  if (cutoffIso) {
    query = query.gte("logged_date", cutoffIso);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const byDate = new Map<string, { calories: number; proteinG: number }>();
  for (const row of data) {
    const date = row.logged_date as string;
    const entry = byDate.get(date) ?? { calories: 0, proteinG: 0 };
    entry.calories += Number(row.calories);
    entry.proteinG += Number(row.protein_g);
    byDate.set(date, entry);
  }

  return [...byDate.entries()].map(([date, totals]) => ({
    date,
    ...totals,
  }));
}

async function loadWeightMeasurements(userId: string) {
  const supabase = await createClient();
  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("weight_kg, created_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("body_measurements")
      .select("measured_date, weight_kg")
      .eq("user_id", userId)
      .order("measured_date", { ascending: true }),
  ]);

  const measurements = (rows ?? []).map((row) => ({
    id: "measurement",
    measuredDate: row.measured_date as string,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
    waistCm: null,
    chestCm: null,
    armsCm: null,
    legsCm: null,
    neckCm: null,
    hipsCm: null,
    bodyFatPct: null,
    notes: null,
  }));

  if (profile?.weight_kg) {
    const baselineDate =
      (profile.created_at as string | undefined)?.slice(0, 10) ??
      new Date().toISOString().slice(0, 10);
    if (!measurements.some((row) => row.measuredDate === baselineDate)) {
      measurements.unshift({
        id: "profile-baseline",
        measuredDate: baselineDate,
        weightKg: Number(profile.weight_kg),
        waistCm: null,
        chestCm: null,
        armsCm: null,
        legsCm: null,
        neckCm: null,
        hipsCm: null,
        bodyFatPct: null,
        notes: null,
      });
    }
  }

  return measurements;
}

export async function buildProAnalyticsBundle(
  userId: string,
  subscription: SubscriptionSnapshot
): Promise<ProAnalyticsBundle> {
  const cutoff = analyticsHistoryCutoff(subscription);
  const cutoffIso = cutoff?.toISOString().slice(0, 10) ?? null;

  const [sessionResult, plan, nutritionLogs, measurements, sleepContext, recoveryContext, activityContext] =
    await Promise.all([
    getServerSessionRecords(userId, 500),
    getActiveProgram(userId),
    loadNutritionDailyTotals(userId, cutoffIso),
    loadWeightMeasurements(userId),
    hasFeature(subscription, "device_integrations")
      ? getSleepContext(userId, subscription)
      : Promise.resolve(null),
    hasFeature(subscription, "device_integrations")
      ? getRecoveryContext(userId, subscription)
      : Promise.resolve(null),
    hasFeature(subscription, "device_integrations")
      ? getActivityContext(userId, subscription)
      : Promise.resolve(null),
  ]);

  const sessions = sessionResult.records;
  const strengthSeries = buildStrengthSeries(sessions, cutoffIso);
  const prHistory = buildPrHistory(sessions, cutoffIso);
  const weeklyVolume = buildWeeklyVolumeTrend(sessions, cutoffIso);
  const muscleVolume = buildMuscleVolumeSlices(sessions, cutoffIso);
  const nutritionAdherence = buildNutritionAdherence(
    nutritionLogs,
    plan?.nutrition ?? null
  );

  const insights = buildRuleInsights({
    measurements,
    sessions,
    plan,
    strengthSeries,
    weeklyVolume,
    nutritionAdherence,
    sleepWeekStats: sleepContext?.weekStats ?? null,
    recoveryWeekStats: recoveryContext?.weekStats ?? null,
    activityWeekStats: activityContext?.weekStats ?? null,
  });

  return {
    strengthSeries,
    prHistory,
    weeklyVolume,
    muscleVolume,
    nutritionAdherence,
    insights,
  };
}

export async function getNutritionAdherenceForUser(
  userId: string,
  subscription: SubscriptionSnapshot
) {
  if (!hasFeature(subscription, "nutrition_adherence")) {
    return null;
  }

  const cutoff = analyticsHistoryCutoff(subscription);
  const cutoffIso = cutoff?.toISOString().slice(0, 10) ?? null;
  const [plan, nutritionLogs] = await Promise.all([
    getActiveProgram(userId),
    loadNutritionDailyTotals(userId, cutoffIso),
  ]);

  return buildNutritionAdherence(nutritionLogs, plan?.nutrition ?? null);
}
