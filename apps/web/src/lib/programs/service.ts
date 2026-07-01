import {
  generateProgram,
  isDeloadTrainingWeek,
  toScheduleStartIso,
  type ProgramPlan,
  type ProgramUserProfile,
} from "@forgefit/program-engine";
import {
  capExperienceForAge,
  maxMinutesPerSessionForAge,
  maxSessionsPerWeekForAge,
} from "@forgefit/program-engine";
import { resolveProfileAge } from "@/lib/profile/identity";
import { createClient } from "@/lib/supabase/server";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
import {
  buildRecentTrainingContextFromSessions,
  fetchLastSessionKindFromDb,
  planReferenceDateForRecentTraining,
  resolveLastSessionKindForRegenerate,
} from "./recent-training";

export async function loadUserProgramContext(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile?.onboarding_complete) return null;

  const { data: equipmentRows } = await supabase
    .from("equipment_inventory")
    .select("equipment_type")
    .eq("user_id", userId);

  const { data: recoveryRows } = await supabase
    .from("recovery_equipment")
    .select("equipment_type")
    .eq("user_id", userId);

  const userProfile: ProgramUserProfile = {
    goal: profile.primary_goal!,
    experience: capExperienceForAge(
      profile.experience_level!,
      resolveProfileAge(profile) ?? profile.age ?? 18
    ),
    sessionsPerWeek: Math.min(
      profile.sessions_per_week!,
      maxSessionsPerWeekForAge(resolveProfileAge(profile) ?? profile.age ?? 18)
    ),
    minutesPerSession: Math.min(
      profile.minutes_per_session!,
      maxMinutesPerSessionForAge(resolveProfileAge(profile) ?? profile.age ?? 18)
    ),
    weightKg: Number(profile.weight_kg),
    heightCm: Number(profile.height_cm),
    age: resolveProfileAge(profile) ?? profile.age!,
    sex: profile.sex ?? "other",
    equipment: equipmentRows?.map((r) => r.equipment_type) ?? [],
    recoveryEquipment: recoveryRows?.map((r) => r.equipment_type) ?? [],
    fatLossPace: profile.fat_loss_pace ?? undefined,
    recompPriority: profile.recomp_priority ?? undefined,
    goalWeightKg:
      profile.goal_weight_kg != null
        ? Number(profile.goal_weight_kg)
        : undefined,
    sportId: profile.sport_id ?? undefined,
    sportPositionId: profile.sport_position_id ?? undefined,
    sportSeasonPhase: profile.sport_season_phase ?? undefined,
    secondaryGoal: profile.secondary_goal ?? undefined,
    sportPracticeDays: profile.sport_practice_days ?? undefined,
    sportPracticeGymPolicy: profile.sport_practice_gym_policy ?? undefined,
    sportPracticeScheduleVaries: profile.sport_practice_schedule_varies ?? undefined,
  };

  return { profile, userProfile };
}

export async function getActiveProgram(
  userId: string
): Promise<ProgramPlan | null> {
  const row = await getActiveProgramRow(userId);
  return (row?.plan as ProgramPlan | null) ?? null;
}

export async function getActiveProgramRow(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("id, plan")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data
    ? { id: data.id as string, plan: data.plan as ProgramPlan }
    : null;
}

async function countCompletedSessions(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  if (error) return 0;
  return count ?? 0;
}

export async function generateAndSaveProgram(
  userId: string,
  previousPlan: ProgramPlan | null = null,
  options: { startDate?: Date; lastSessionKindOverride?: string } = {}
): Promise<{ plan: ProgramPlan; previousPlan: ProgramPlan | null } | { error: string }> {
  const ctx = await loadUserProgramContext(userId);
  if (!ctx) {
    return { error: "Complete onboarding before generating a program." };
  }

  const priorPlan = previousPlan ?? (await getActiveProgram(userId));
  const completedSessions = await countCompletedSessions(userId);
  const isDeloadWeek = isDeloadTrainingWeek(
    completedSessions,
    ctx.userProfile.sessionsPerWeek
  );

  const startDate = options.startDate ?? new Date();
  const todayIso = toScheduleStartIso(new Date());
  const startIso = toScheduleStartIso(startDate);
  const isFutureStart = startIso > todayIso;
  const isRegenerate = priorPlan != null;

  let recentTraining;
  if (isRegenerate && priorPlan) {
    const { records } = await getServerSessionRecords(userId, 50);
    let lastSessionKind =
      options.lastSessionKindOverride ??
      resolveLastSessionKindForRegenerate(records, startDate);
    if (!lastSessionKind) {
      lastSessionKind = await fetchLastSessionKindFromDb(userId, startDate);
    }

    recentTraining = buildRecentTrainingContextFromSessions(
      records,
      priorPlan,
      startDate,
      planReferenceDateForRecentTraining(priorPlan, startDate),
      lastSessionKind
    );
  }

  const plan = generateProgram(ctx.userProfile, {
    startDate,
    isDeloadWeek,
    deloadVolumeReductionPct: 40,
    scheduleFromTodayOnly:
      isRegenerate && !isFutureStart && startIso <= todayIso,
    recentTraining,
    lastSessionKindOverride: recentTraining?.lastSessionKind,
  });

  const supabase = await createClient();

  await supabase
    .from("programs")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);

  const { error } = await supabase.from("programs").insert({
    user_id: userId,
    plan,
    evidence_kb_version: plan.evidenceKbVersion,
    engine_version: plan.version,
    goal_type: plan.goal,
    is_active: true,
  });

  if (error) {
    return { error: error.message };
  }

  return { plan, previousPlan: priorPlan };
}

export async function ensureActiveProgram(
  userId: string
): Promise<ProgramPlan | null> {
  const existing = await getActiveProgram(userId);
  if (existing) return existing;

  const result = await generateAndSaveProgram(userId);
  if ("error" in result) return null;
  return result.plan;
}
