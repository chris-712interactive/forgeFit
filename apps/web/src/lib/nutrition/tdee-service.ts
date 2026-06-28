import {
  analyticsHistoryCutoff,
  hasFeature,
} from "@/lib/billing/gates";
import type { SubscriptionSnapshot } from "@/lib/billing/types";
import { loadNutritionDailyTotals } from "@/lib/nutrition/daily-totals";
import type { DailyNutritionSummary } from "@/lib/nutrition/types";
import { getActiveProgram, loadUserProgramContext } from "@/lib/programs/service";
import { createClient } from "@/lib/supabase/server";
import {
  buildPlanTdeeBreakdown,
  sumLoggedSessionsKcal,
  type PlanTdeeBreakdown,
} from "@forgefit/program-engine";
import { inferAdaptiveTdee, type AdaptiveTdeeResult } from "@forgefit/projection-engine";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";

export interface DailyEnergySnapshot {
  date: string;
  intakeKcal: number;
  targetKcal: number;
  planTrainingKcalPerDay: number;
  actualTrainingKcal: number;
  dynamicTargetKcal: number;
  completedWorkouts: number;
  isTrainingDay: boolean;
  /** Plain-language delta vs static program target */
  targetNote: string;
}

export interface TdeeDashboard {
  plan: PlanTdeeBreakdown | null;
  daily: DailyEnergySnapshot | null;
  adaptive: AdaptiveTdeeResult | null;
  adaptiveUnlocked: boolean;
  adaptiveNeedsData: boolean;
}

function sessionsOnDate(
  records: WorkoutSessionRecord[],
  isoDate: string
): WorkoutSessionRecord[] {
  return records.filter(
    (record) =>
      record.status === "completed" &&
      (record.completedAt ?? record.startedAt).slice(0, 10) === isoDate
  );
}

function buildDailyEnergySnapshot(
  summary: DailyNutritionSummary,
  completedSessions: WorkoutSessionRecord[],
  weightKg: number,
  intensityScore: number
): DailyEnergySnapshot | null {
  const targets = summary.targets;
  if (!targets) return null;

  const planTrainingKcalPerDay = Math.round(targets.trainingKcalPerDay ?? 0);
  const actualTrainingKcal = sumLoggedSessionsKcal(
    completedSessions,
    weightKg,
    intensityScore
  );
  const baseTdee = targets.tdeeKcal ?? targets.calories;
  const goalOffset = targets.calories - baseTdee;
  const dynamicTargetKcal = Math.round(
    baseTdee + goalOffset - planTrainingKcalPerDay + actualTrainingKcal
  );

  let targetNote =
    "Your program target assumes an average training week. Today matches that plan.";
  if (actualTrainingKcal > planTrainingKcalPerDay + 40) {
    targetNote =
      "You trained harder than your weekly average today, so your target is a bit higher.";
  } else if (
    actualTrainingKcal === 0 &&
    planTrainingKcalPerDay > 0 &&
    completedSessions.length === 0
  ) {
    targetNote =
      "No workout logged yet today — target uses your plan average until you log training.";
  } else if (actualTrainingKcal > 0 && actualTrainingKcal < planTrainingKcalPerDay - 40) {
    targetNote =
      "Today's logged session was lighter than your plan average.";
  }

  return {
    date: summary.date,
    intakeKcal: Math.round(summary.totals.calories),
    targetKcal: targets.calories,
    planTrainingKcalPerDay,
    actualTrainingKcal,
    dynamicTargetKcal,
    completedWorkouts: completedSessions.length,
    isTrainingDay: actualTrainingKcal > 0,
    targetNote,
  };
}

async function loadWeightPoints(userId: string) {
  const supabase = await createClient();
  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("weight_kg, created_at").eq("id", userId).single(),
    supabase
      .from("body_measurements")
      .select("measured_date, weight_kg")
      .eq("user_id", userId)
      .order("measured_date", { ascending: true }),
  ]);

  const points = (rows ?? [])
    .filter((row) => row.weight_kg != null)
    .map((row) => ({
      date: row.measured_date as string,
      weightKg: Number(row.weight_kg),
    }));

  if (points.length === 0 && profile?.weight_kg) {
    points.push({
      date:
        (profile.created_at as string | undefined)?.slice(0, 10) ??
        new Date().toISOString().slice(0, 10),
      weightKg: Number(profile.weight_kg),
    });
  }

  return points;
}

export async function getTdeeDashboard(
  userId: string,
  summary: DailyNutritionSummary,
  subscription: SubscriptionSnapshot | null
): Promise<TdeeDashboard> {
  const adaptiveUnlocked =
    subscription != null && hasFeature(subscription, "tdee_adaptive");

  const plan = summary.targets
    ? buildPlanTdeeBreakdown(summary.targets)
    : null;

  const [context, program, sessionResult] = await Promise.all([
    loadUserProgramContext(userId),
    getActiveProgram(userId),
    getServerSessionRecords(userId, 120),
  ]);

  const weightKg = context?.userProfile.weightKg ?? 75;
  const intensityScore = program?.nutrition.trainingLoad?.intensityScore ?? 1;
  const todaySessions = sessionsOnDate(sessionResult.records, summary.date);
  const daily = buildDailyEnergySnapshot(
    summary,
    todaySessions,
    weightKg,
    intensityScore
  );

  if (!adaptiveUnlocked) {
    return {
      plan,
      daily,
      adaptive: null,
      adaptiveUnlocked: false,
      adaptiveNeedsData: false,
    };
  }

  const cutoff = analyticsHistoryCutoff(subscription!);
  const cutoffIso = cutoff?.toISOString().slice(0, 10) ?? null;
  const [intakeRows, weightPoints] = await Promise.all([
    loadNutritionDailyTotals(userId, cutoffIso),
    loadWeightPoints(userId),
  ]);

  const adaptive = inferAdaptiveTdee(
    intakeRows.map((row) => ({ date: row.date, calories: row.calories })),
    weightPoints,
    summary.date
  );

  return {
    plan,
    daily,
    adaptive,
    adaptiveUnlocked: true,
    adaptiveNeedsData: adaptive == null,
  };
}
