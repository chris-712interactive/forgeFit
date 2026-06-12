import {
  generateProgram,
  isDeloadTrainingWeek,
  type ProgramPlan,
  type ProgramUserProfile,
} from "@forgefit/program-engine";
import { resolveProfileAge } from "@/lib/profile/identity";
import { createClient } from "@/lib/supabase/server";

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
    experience: profile.experience_level!,
    sessionsPerWeek: profile.sessions_per_week!,
    minutesPerSession: profile.minutes_per_session!,
    weightKg: Number(profile.weight_kg),
    heightCm: Number(profile.height_cm),
    age: resolveProfileAge(profile) ?? profile.age!,
    sex: profile.sex ?? "other",
    equipment: equipmentRows?.map((r) => r.equipment_type) ?? [],
    recoveryEquipment: recoveryRows?.map((r) => r.equipment_type) ?? [],
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
  previousPlan: ProgramPlan | null = null
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

  const plan = generateProgram(ctx.userProfile, {
    startDate: new Date(),
    isDeloadWeek,
    deloadVolumeReductionPct: 40,
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
