import {
  buildTrendSeries,
  projectWaist,
  projectWeight,
  type WaistProjectionResult,
  type WeightProjectionResult,
} from "@forgefit/projection-engine";
import type { FitnessGoal, ProgramPlan } from "@forgefit/program-engine";
import { buildProAnalyticsBundle } from "@/lib/analytics/service";
import { getActivityContext } from "@/lib/activity/service";
import {
  analyticsHistoryDays,
  hasFeature,
  projectionHorizonDays,
} from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasProAccess, type SubscriptionSnapshot } from "@/lib/billing/types";
import { listProgressPhotos } from "@/lib/progress-photos/service";
import { getActiveProgram } from "@/lib/programs/service";
import { resolveProfileAge } from "@/lib/profile/identity";
import { createClient } from "@/lib/supabase/server";
import type {
  BodyMeasurementRow,
  CaliperMeasurementRow,
  ProgressDashboardData,
} from "./types";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapBodyRow(row: Record<string, unknown>): BodyMeasurementRow {
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

function mapCaliperRow(row: Record<string, unknown>): CaliperMeasurementRow {
  return {
    id: row.id as string,
    measuredDate: row.measured_date as string,
    formula: row.formula as "jp3" | "jp7",
    bodyFatPct: Number(row.body_fat_pct),
    sumMm: Number(row.sum_mm),
  };
}

async function getProfileBasics(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "primary_goal, age, date_of_birth, sex, weight_kg, waist_cm, chest_cm, arms_cm, legs_cm, neck_cm, hips_cm, created_at"
    )
    .eq("id", userId)
    .single();

  return data;
}

function mergeMeasurementRows(
  baseline: BodyMeasurementRow | null,
  rows: BodyMeasurementRow[]
): BodyMeasurementRow[] {
  const byDate = new Map<string, BodyMeasurementRow>();

  if (baseline) {
    byDate.set(baseline.measuredDate, baseline);
  }

  for (const row of rows) {
    const existing = byDate.get(row.measuredDate);
    if (!existing) {
      byDate.set(row.measuredDate, row);
      continue;
    }

    byDate.set(row.measuredDate, {
      ...existing,
      ...row,
      weightKg: row.weightKg ?? existing.weightKg,
      waistCm: row.waistCm ?? existing.waistCm,
      chestCm: row.chestCm ?? existing.chestCm,
      armsCm: row.armsCm ?? existing.armsCm,
      legsCm: row.legsCm ?? existing.legsCm,
      neckCm: row.neckCm ?? existing.neckCm,
      hipsCm: row.hipsCm ?? existing.hipsCm,
      bodyFatPct: row.bodyFatPct ?? existing.bodyFatPct,
      notes: row.notes ?? existing.notes,
    });
  }

  return [...byDate.values()].sort((a, b) =>
    a.measuredDate.localeCompare(b.measuredDate)
  );
}

function profileBaseline(
  profile: Record<string, unknown> | null
): BodyMeasurementRow | null {
  if (!profile?.weight_kg) return null;

  const createdAt = profile.created_at as string | undefined;
  return {
    id: "profile-baseline",
    measuredDate: createdAt?.slice(0, 10) ?? todayIsoDate(),
    weightKg: Number(profile.weight_kg),
    waistCm: profile.waist_cm != null ? Number(profile.waist_cm) : null,
    chestCm: profile.chest_cm != null ? Number(profile.chest_cm) : null,
    armsCm: profile.arms_cm != null ? Number(profile.arms_cm) : null,
    legsCm: profile.legs_cm != null ? Number(profile.legs_cm) : null,
    neckCm: profile.neck_cm != null ? Number(profile.neck_cm) : null,
    hipsCm: profile.hips_cm != null ? Number(profile.hips_cm) : null,
    bodyFatPct: null,
    notes: "From onboarding",
  };
}

async function loadMeasurements(
  userId: string
): Promise<{ rows: BodyMeasurementRow[]; tableReady: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("body_measurements")
    .select("*")
    .eq("user_id", userId)
    .order("measured_date", { ascending: true });

  if (error) {
    const missing = error.message.includes("body_measurements");
    return { rows: [], tableReady: !missing };
  }

  return { rows: (data ?? []).map(mapBodyRow), tableReady: true };
}

async function loadCaliperEntries(
  userId: string
): Promise<CaliperMeasurementRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("caliper_measurements")
    .select("id, measured_date, formula, body_fat_pct, sum_mm")
    .eq("user_id", userId)
    .order("measured_date", { ascending: false })
    .limit(10);

  if (error) return [];
  return (data ?? []).map(mapCaliperRow);
}

function filterMeasurementsForAnalytics(
  measurements: BodyMeasurementRow[],
  historyDays: number | null
): BodyMeasurementRow[] {
  if (historyDays === null) return measurements;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - historyDays);
  cutoff.setHours(0, 0, 0, 0);
  const iso = cutoff.toISOString().slice(0, 10);

  return measurements.filter((row) => row.measuredDate >= iso);
}

function buildProjection(
  measurements: BodyMeasurementRow[],
  goal: FitnessGoal,
  age: number,
  plan: ProgramPlan | null,
  horizonDays: number,
  includeConfidenceBand: boolean
): WeightProjectionResult | null {
  const weightHistory = measurements
    .filter((row) => row.weightKg != null && row.weightKg > 0)
    .map((row) => ({
      date: row.measuredDate,
      weightKg: row.weightKg as number,
    }));

  if (weightHistory.length === 0) return null;

  const nutrition = plan?.nutrition;

  return projectWeight({
    history: weightHistory,
    goal,
    age,
    horizonDays,
    effectiveDeficitKcal: nutrition?.effectiveDeficitKcal,
    effectiveSurplusKcal: nutrition?.effectiveSurplusKcal,
    trainingKcalPerDay: nutrition?.trainingKcalPerDay,
    includeConfidenceBand,
  });
}

function buildWaistProjection(
  measurements: BodyMeasurementRow[],
  horizonDays: number,
  goal: FitnessGoal | null,
  enabled: boolean
): WaistProjectionResult | null {
  if (!enabled || !goal) return null;

  const waistHistory = measurements
    .filter((row) => row.waistCm != null && row.waistCm > 0)
    .map((row) => ({
      date: row.measuredDate,
      waistCm: row.waistCm as number,
    }));

  return projectWaist({
    history: waistHistory,
    horizonDays,
    goal,
  });
}

function buildGateContext(
  subscription: SubscriptionSnapshot
): ProgressDashboardData["gates"] {
  return {
    subscription,
    horizonDays: projectionHorizonDays(subscription),
    showConfidenceBands: hasFeature(
      subscription,
      "projection_confidence_bands"
    ),
    showGoalDate: hasFeature(subscription, "projection_goal_date"),
    showWaistProjection: hasFeature(
      subscription,
      "projection_secondary_metrics"
    ),
    analyticsHistoryDays: analyticsHistoryDays(subscription),
  };
}

export async function getProgressDashboardData(
  userId: string
): Promise<ProgressDashboardData> {
  const [profile, measurementResult, caliperEntries, plan, subscription] =
    await Promise.all([
      getProfileBasics(userId),
      loadMeasurements(userId),
      loadCaliperEntries(userId),
      getActiveProgram(userId),
      getSubscriptionForUser(userId),
    ]);

  const isPro = hasProAccess(subscription);
  const [proAnalytics, photoResult, activity] = await Promise.all([
    isPro ? buildProAnalyticsBundle(userId, subscription) : Promise.resolve(null),
    hasFeature(subscription, "progress_photos")
      ? listProgressPhotos(userId)
      : Promise.resolve({ photos: [], tableReady: true }),
    getActivityContext(userId, subscription),
  ]);

  const gates = buildGateContext(subscription);

  const baseline = profileBaseline(profile);
  const measurements = mergeMeasurementRows(baseline, measurementResult.rows);
  const analyticsMeasurements = filterMeasurementsForAnalytics(
    measurements,
    gates.analyticsHistoryDays
  );

  const goal = (profile?.primary_goal as FitnessGoal | null) ?? null;
  const age = profile ? resolveProfileAge(profile) : null;

  const projection =
    goal && age && measurements.length > 0
      ? buildProjection(
          measurements,
          goal,
          age,
          plan,
          gates.horizonDays,
          gates.showConfidenceBands
        )
      : null;

  const waistHistoryCount = measurements.filter(
    (row) => row.waistCm != null && row.waistCm > 0
  ).length;

  const waistProjection = goal
    ? buildWaistProjection(
        measurements,
        gates.horizonDays,
        goal,
        gates.showWaistProjection
      )
    : null;

  const trends = buildTrendSeries(
    analyticsMeasurements.map((row) => ({
      measuredDate: row.measuredDate,
      weightKg: row.weightKg,
      waistCm: row.waistCm,
      chestCm: row.chestCm,
      armsCm: row.armsCm,
      legsCm: row.legsCm,
      neckCm: row.neckCm,
      hipsCm: row.hipsCm,
      bodyFatPct: row.bodyFatPct,
    })),
    ["weightKg", "waistCm", "bodyFatPct"]
  );

  if (projection && measurementResult.tableReady) {
    void cacheProjection(userId, projection, gates.horizonDays);
  }

  return {
    goal,
    age,
    sex: (profile?.sex as string | null) ?? null,
    measurements,
    caliperEntries,
    trends,
    projection,
    waistProjection,
    hasWaistHistory: waistHistoryCount >= 2,
    tableReady: measurementResult.tableReady,
    gates,
    proAnalytics,
    progressPhotos: photoResult.photos,
    photosTableReady: photoResult.tableReady,
    activity,
  };
}

async function cacheProjection(
  userId: string,
  projection: WeightProjectionResult,
  horizonDays: number
): Promise<void> {
  const supabase = await createClient();
  const projectionType = horizonDays > 30 ? "weight_90d" : "weight_30d";
  await supabase.from("projections").upsert(
    {
      user_id: userId,
      projection_type: projectionType,
      horizon_days: projection.horizonDays,
      payload: projection,
      computed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,projection_type" }
  );
}
