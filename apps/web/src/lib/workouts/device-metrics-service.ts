import {
  addDaysIso,
  EXERCISE_SYNC_LOOKBACK_DAYS,
  fetchExerciseSessions,
  todayIsoDate,
  type ExerciseSessionSummary,
} from "@forgefit/integrations";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import {
  getValidFitbitAccessToken,
  getIntegrationRow,
} from "@/lib/integrations/service";
import {
  assessSessionIntensity,
  type LoggedSessionStats,
} from "./intensity-assessment";
import {
  matchSessionsToExercises,
  type WorkoutSessionWindow,
} from "./device-correlation";
import type {
  DeviceMatchConfidence,
  IntensityBand,
  IntensityVerdict,
  RirAgreement,
  SessionIntensitySummary,
  WorkoutDeviceMetricsRecord,
} from "./device-metrics-types";

const CORRELATION_LOOKBACK_DAYS = EXERCISE_SYNC_LOOKBACK_DAYS;

interface WorkoutSessionRow {
  id: string;
  client_id: string;
  started_at: string;
  completed_at: string;
  status: string;
}

interface ExerciseSetRow {
  workout_session_id: string;
  rir: number | null;
  completed: boolean;
}

function mapConfidence(value: string | null): DeviceMatchConfidence {
  if (
    value === "high" ||
    value === "medium" ||
    value === "low" ||
    value === "none"
  ) {
    return value;
  }
  return "none";
}

function mapIntensityBand(value: string | null): IntensityBand | null {
  if (value === "low" || value === "moderate" || value === "high") {
    return value;
  }
  return null;
}

function mapVerdict(value: string | null): IntensityVerdict {
  if (
    value === "on_target" ||
    value === "too_easy" ||
    value === "too_hard" ||
    value === "inconclusive"
  ) {
    return value;
  }
  return "inconclusive";
}

function mapRirAgreement(value: string | null): RirAgreement | null {
  if (
    value === "aligned" ||
    value === "harder_than_logged" ||
    value === "easier_than_logged"
  ) {
    return value;
  }
  return null;
}

function rowToRecord(
  row: Record<string, unknown>,
  clientId: string
): WorkoutDeviceMetricsRecord {
  return {
    workoutSessionId: row.workout_session_id as string,
    clientId,
    source: (row.source as string) ?? "google_health",
    externalExerciseId: (row.external_exercise_id as string | null) ?? null,
    overlapRatio:
      row.overlap_ratio != null ? Number(row.overlap_ratio) : null,
    matchConfidence: mapConfidence((row.match_confidence as string) ?? null),
    avgHeartRateBpm:
      row.avg_heart_rate_bpm != null ? Number(row.avg_heart_rate_bpm) : null,
    activeZoneMinutes:
      row.active_zone_minutes != null
        ? Number(row.active_zone_minutes)
        : null,
    caloriesKcal:
      row.calories_kcal != null ? Number(row.calories_kcal) : null,
    zoneLightSeconds:
      row.zone_light_seconds != null ? Number(row.zone_light_seconds) : null,
    zoneFatBurnSeconds:
      row.zone_fat_burn_seconds != null
        ? Number(row.zone_fat_burn_seconds)
        : null,
    zoneCardioSeconds:
      row.zone_cardio_seconds != null
        ? Number(row.zone_cardio_seconds)
        : null,
    zonePeakSeconds:
      row.zone_peak_seconds != null ? Number(row.zone_peak_seconds) : null,
    exerciseType: (row.exercise_type as string | null) ?? null,
    displayName: (row.display_name as string | null) ?? null,
    loggedAvgRir:
      row.logged_avg_rir != null ? Number(row.logged_avg_rir) : null,
    loggedHardSets:
      row.logged_hard_sets != null ? Number(row.logged_hard_sets) : null,
    intensityBand: mapIntensityBand((row.intensity_band as string) ?? null),
    intensityVerdict: mapVerdict((row.intensity_verdict as string) ?? null),
    rirAgreement: mapRirAgreement((row.rir_agreement as string) ?? null),
    evidenceRuleId: (row.evidence_rule_id as string | null) ?? null,
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

function loggedStatsFromSets(sets: ExerciseSetRow[]): LoggedSessionStats {
  const completed = sets.filter((set) => set.completed);
  const withRir = completed.filter((set) => set.rir != null);
  const avgRir =
    withRir.length > 0
      ? withRir.reduce((sum, set) => sum + (set.rir ?? 0), 0) / withRir.length
      : null;
  const hardSets = completed.filter((set) => set.rir != null && set.rir <= 0)
    .length;

  return {
    avgRir,
    hardSets,
    durationMinutes: null,
  };
}

function sessionDurationMinutes(
  startedAt: string,
  completedAt: string
): number | null {
  const start = Date.parse(startedAt);
  const end = Date.parse(completedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }
  return Math.round((end - start) / 60000);
}

async function loadProfileGoal(userId: string): Promise<{
  goal: import("@/lib/types/profile").FitnessGoal;
  experience: import("@/lib/types/profile").ExperienceLevel;
  isDeloadWeek: boolean;
}> {
  const admin = createAdminClient();
  const [{ data: profile }, { data: program }] = await Promise.all([
    admin
      .from("profiles")
      .select("primary_goal, experience_level")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("programs")
      .select("plan")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const plan = program?.plan as { isDeloadWeek?: boolean } | null | undefined;

  return {
    goal:
      (profile?.primary_goal as import("@/lib/types/profile").FitnessGoal) ??
      "general_strength",
    experience:
      (profile?.experience_level as import("@/lib/types/profile").ExperienceLevel) ??
      "beginner",
    isDeloadWeek: plan?.isDeloadWeek === true,
  };
}

async function upsertUnmatchedExercise(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  exercise: ExerciseSessionSummary
): Promise<void> {
  const durationSeconds =
    exercise.durationSeconds ??
    Math.max(
      0,
      Math.round(
        (Date.parse(exercise.completedAt) - Date.parse(exercise.startedAt)) /
          1000
      )
    );

  await admin.from("external_activity_logs").upsert(
    {
      user_id: userId,
      source: "google_health",
      external_id: exercise.externalId,
      name: exercise.displayName ?? exercise.exerciseType ?? "Exercise",
      activity_type: exercise.exerciseType ?? "other",
      started_at: exercise.startedAt,
      duration_seconds: durationSeconds,
      moving_seconds: durationSeconds,
      distance_meters: null,
      elevation_gain_meters: null,
      calories: exercise.caloriesKcal,
      average_heartrate: exercise.avgHeartRateBpm,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,source,external_id" }
  );
}

export async function correlateWorkoutSessionsForUser(
  userId: string,
  options?: {
    sessionIds?: string[];
    lookbackDays?: number;
    exercises?: ExerciseSessionSummary[];
  }
): Promise<{ correlated: number; unmatchedCardio: number }> {
  const subscription = await getSubscriptionForUser(userId);
  if (!hasFeature(subscription, "device_integrations")) {
    return { correlated: 0, unmatchedCardio: 0 };
  }

  let integrationRow;
  try {
    integrationRow = await getIntegrationRow(userId, "fitbit");
  } catch {
    return { correlated: 0, unmatchedCardio: 0 };
  }

  if (!integrationRow || integrationRow.status === "revoked") {
    return { correlated: 0, unmatchedCardio: 0 };
  }

  const admin = createAdminClient();
  const lookbackDays = options?.lookbackDays ?? CORRELATION_LOOKBACK_DAYS;
  const startDate = addDaysIso(todayIsoDate(), -(lookbackDays - 1));

  let exercises = options?.exercises;
  if (!exercises) {
    const accessToken = await getValidFitbitAccessToken(integrationRow);
    exercises = await fetchExerciseSessions({
      accessToken,
      startDate,
      endDate: todayIsoDate(),
    });
  }

  let sessionQuery = admin
    .from("workout_sessions")
    .select("id, client_id, started_at, completed_at, status")
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("completed_at", `${startDate}T00:00:00.000Z`)
    .order("completed_at", { ascending: false });

  if (options?.sessionIds?.length) {
    sessionQuery = sessionQuery.in("id", options.sessionIds);
  }

  const { data: sessionRows, error: sessionError } = await sessionQuery;
  if (sessionError || !sessionRows?.length) {
    return { correlated: 0, unmatchedCardio: 0 };
  }

  const sessions = sessionRows as WorkoutSessionRow[];
  const sessionIds = sessions.map((row) => row.id);

  const { data: setRows } = await admin
    .from("exercise_sets")
    .select("workout_session_id, rir, completed")
    .eq("user_id", userId)
    .in("workout_session_id", sessionIds);

  const setsBySession = new Map<string, ExerciseSetRow[]>();
  for (const set of (setRows ?? []) as ExerciseSetRow[]) {
    const list = setsBySession.get(set.workout_session_id) ?? [];
    list.push(set);
    setsBySession.set(set.workout_session_id, list);
  }

  const windows: WorkoutSessionWindow[] = sessions
    .filter((row) => row.completed_at)
    .map((row) => ({
      id: row.id,
      startedAt: row.started_at,
      completedAt: row.completed_at,
    }));

  const matches = matchSessionsToExercises(windows, exercises);
  const profile = await loadProfileGoal(userId);

  let correlated = 0;
  const matchedExerciseIds = new Set<string>();

  for (const session of sessions) {
    if (!session.completed_at) continue;

    const match = matches.get(session.id);
    const logged = loggedStatsFromSets(setsBySession.get(session.id) ?? []);
    logged.durationMinutes = sessionDurationMinutes(
      session.started_at,
      session.completed_at
    );

    if (match) {
      matchedExerciseIds.add(match.exercise.externalId);
      const assessment = assessSessionIntensity({
        goal: profile.goal,
        experience: profile.experience,
        isDeloadWeek: profile.isDeloadWeek,
        logged,
        device: {
          avgHeartRateBpm: match.exercise.avgHeartRateBpm,
          activeZoneMinutes: match.exercise.activeZoneMinutes,
          zonePeakSeconds: match.exercise.zoneDurations.peakSeconds,
          zoneCardioSeconds: match.exercise.zoneDurations.cardioSeconds,
          zoneFatBurnSeconds: match.exercise.zoneDurations.fatBurnSeconds,
          matchConfidence: match.confidence,
        },
      });

      const now = new Date().toISOString();
      const { error } = await admin.from("workout_device_metrics").upsert(
        {
          user_id: userId,
          workout_session_id: session.id,
          source: "google_health",
          external_exercise_id: match.exercise.externalId,
          overlap_ratio: match.overlapRatio,
          match_confidence: match.confidence,
          avg_heart_rate_bpm: match.exercise.avgHeartRateBpm,
          active_zone_minutes: match.exercise.activeZoneMinutes,
          calories_kcal: match.exercise.caloriesKcal,
          zone_light_seconds: match.exercise.zoneDurations.lightSeconds,
          zone_fat_burn_seconds: match.exercise.zoneDurations.fatBurnSeconds,
          zone_cardio_seconds: match.exercise.zoneDurations.cardioSeconds,
          zone_peak_seconds: match.exercise.zoneDurations.peakSeconds,
          exercise_type: match.exercise.exerciseType,
          display_name: match.exercise.displayName,
          logged_avg_rir: logged.avgRir,
          logged_hard_sets: logged.hardSets,
          intensity_band: assessment.intensityBand,
          intensity_verdict: assessment.intensityVerdict,
          rir_agreement: assessment.rirAgreement,
          evidence_rule_id: assessment.evidenceRuleId,
          raw_summary: match.exercise.rawSummary,
          updated_at: now,
        },
        { onConflict: "workout_session_id" }
      );

      if (!error) correlated += 1;
      continue;
    }

    const now = new Date().toISOString();
    await admin.from("workout_device_metrics").upsert(
      {
        user_id: userId,
        workout_session_id: session.id,
        source: "google_health",
        match_confidence: "none",
        logged_avg_rir: logged.avgRir,
        logged_hard_sets: logged.hardSets,
        intensity_verdict: "inconclusive",
        updated_at: now,
      },
      { onConflict: "workout_session_id" }
    );
  }

  let unmatchedCardio = 0;
  for (const exercise of exercises) {
    if (matchedExerciseIds.has(exercise.externalId)) continue;
    await upsertUnmatchedExercise(admin, userId, exercise);
    unmatchedCardio += 1;
  }

  return { correlated, unmatchedCardio };
}

export async function scheduleWorkoutDeviceCorrelation(
  userId: string,
  sessionIds?: string[]
): Promise<void> {
  try {
    await correlateWorkoutSessionsForUser(userId, { sessionIds });
  } catch {
    // Non-fatal — device metrics enrich workouts but must not break sync.
  }
}

export async function getWorkoutDeviceMetricsByClientIds(
  userId: string,
  clientIds: string[]
): Promise<Map<string, WorkoutDeviceMetricsRecord>> {
  const result = new Map<string, WorkoutDeviceMetricsRecord>();
  if (clientIds.length === 0) return result;

  const admin = createAdminClient();
  const { data: sessions } = await admin
    .from("workout_sessions")
    .select("id, client_id")
    .eq("user_id", userId)
    .in("client_id", clientIds);

  if (!sessions?.length) return result;

  const sessionIdToClientId = new Map(
    sessions.map((row) => [row.id as string, row.client_id as string])
  );

  const { data: metrics, error } = await admin
    .from("workout_device_metrics")
    .select("*")
    .eq("user_id", userId)
    .in("workout_session_id", [...sessionIdToClientId.keys()]);

  if (error || !metrics?.length) return result;

  for (const row of metrics) {
    const clientId = sessionIdToClientId.get(row.workout_session_id as string);
    if (!clientId) continue;
    result.set(
      clientId,
      rowToRecord(row as Record<string, unknown>, clientId)
    );
  }

  return result;
}

export function summarizeSessionIntensity(
  records: WorkoutDeviceMetricsRecord[]
): SessionIntensitySummary {
  const withMetrics = records.filter(
    (record) => record.matchConfidence !== "none"
  );

  return {
    sessionsWithMetrics: withMetrics.length,
    sessionsOnTarget: withMetrics.filter(
      (record) => record.intensityVerdict === "on_target"
    ).length,
    sessionsTooEasy: withMetrics.filter(
      (record) => record.intensityVerdict === "too_easy"
    ).length,
    sessionsTooHard: withMetrics.filter(
      (record) => record.intensityVerdict === "too_hard"
    ).length,
    sessionsHarderThanLogged: withMetrics.filter(
      (record) => record.rirAgreement === "harder_than_logged"
    ).length,
  };
}

export async function getWeeklyWorkoutDeviceMetrics(
  userId: string,
  weekStartIso: string,
  weekEndIso: string
): Promise<WorkoutDeviceMetricsRecord[]> {
  const admin = createAdminClient();
  const { data: sessions } = await admin
    .from("workout_sessions")
    .select("id, client_id, completed_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("completed_at", `${weekStartIso}T00:00:00.000Z`)
    .lte("completed_at", `${weekEndIso}T23:59:59.999Z`);

  if (!sessions?.length) return [];

  const sessionIdToClientId = new Map(
    sessions.map((row) => [row.id as string, row.client_id as string])
  );

  const { data: metrics } = await admin
    .from("workout_device_metrics")
    .select("*")
    .eq("user_id", userId)
    .in("workout_session_id", [...sessionIdToClientId.keys()]);

  if (!metrics?.length) return [];

  return metrics.map((row) =>
    rowToRecord(row as Record<string, unknown>, sessionIdToClientId.get(row.workout_session_id as string) ?? "")
  );
}

export async function hasMissingWorkoutDeviceMetrics(
  userId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const startDate = addDaysIso(todayIsoDate(), -(CORRELATION_LOOKBACK_DAYS - 1));

  const { data: sessions } = await admin
    .from("workout_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("completed_at", `${startDate}T00:00:00.000Z`)
    .limit(20);

  if (!sessions?.length) return false;

  const { data: metrics } = await admin
    .from("workout_device_metrics")
    .select("workout_session_id")
    .eq("user_id", userId)
    .in(
      "workout_session_id",
      sessions.map((row) => row.id as string)
    );

  return (metrics?.length ?? 0) < sessions.length;
}
