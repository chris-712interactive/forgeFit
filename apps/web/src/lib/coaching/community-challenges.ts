import { createClient } from "@/lib/supabase/server";
import { countQualitySessionsInLookback } from "@/lib/progression/adherence";
import { computeWeeklyWorkStats } from "@/lib/home/weekly-stats";
import type { ProgramPlan } from "@forgefit/program-engine";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";

export type WeeklyChallengeKey =
  | "plan_completion"
  | "quality_sessions"
  | "protein_days";

export interface WeeklyChallengeDefinition {
  key: WeeklyChallengeKey;
  title: string;
  description: string;
  targetValue: number;
  unit: "percent" | "count";
}

export interface WeeklyChallengeProgress {
  definition: WeeklyChallengeDefinition;
  progressValue: number;
  completed: boolean;
  bucketCompletedCount: number;
  bucketParticipantCount: number;
}

export interface CrewChallengeProgress {
  completedCount: number;
  memberCount: number;
  targetPercent: number;
  crewMetGoal: boolean;
}

const CHALLENGE_ROTATION: WeeklyChallengeDefinition[] = [
  {
    key: "plan_completion",
    title: "Plan completion",
    description: "Complete at least 80% of your planned workouts this week.",
    targetValue: 80,
    unit: "percent",
  },
  {
    key: "quality_sessions",
    title: "Quality sessions",
    description: "Log 3 quality workouts (50%+ sets with reps & RIR) this week.",
    targetValue: 3,
    unit: "count",
  },
  {
    key: "protein_days",
    title: "Protein consistency",
    description: "Hit your protein target on 4 of 7 days this week.",
    targetValue: 4,
    unit: "count",
  },
];

export function getWeeklyChallengeDefinition(
  weekStart: string
): WeeklyChallengeDefinition {
  const weekMs = new Date(`${weekStart}T12:00:00.000Z`).getTime();
  const weekIndex = Math.floor(weekMs / (7 * 24 * 60 * 60 * 1000));
  return CHALLENGE_ROTATION[weekIndex % CHALLENGE_ROTATION.length]!;
}

function qualitySessionsThisWeek(
  sessions: WorkoutSessionRecord[],
  referenceDate = new Date()
): number {
  const { start, end } = (() => {
    const s = new Date(referenceDate);
    const day = s.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    s.setHours(0, 0, 0, 0);
    s.setDate(s.getDate() + diff);
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  })();

  const weekSessions = sessions.filter((session) => {
    if (session.status !== "completed") return false;
    const iso = session.completedAt ?? session.startedAt;
    const time = new Date(iso).getTime();
    return time >= start.getTime() && time <= end.getTime();
  });

  return countQualitySessionsInLookback(weekSessions, weekSessions.length || 1, 0.5);
}

export function computeChallengeMetrics(input: {
  definition: WeeklyChallengeDefinition;
  sessions: WorkoutSessionRecord[];
  plan: ProgramPlan | null;
  proteinHitDays: number;
}): { progressValue: number; completed: boolean } {
  const weekly = computeWeeklyWorkStats(input.sessions, input.plan);
  const { definition } = input;

  if (definition.key === "plan_completion") {
    const ratio =
      weekly.workoutsPlanned > 0
        ? (weekly.workoutsCompleted / weekly.workoutsPlanned) * 100
        : weekly.workoutsCompleted > 0
          ? 100
          : 0;
    const progressValue = Math.round(ratio);
    return {
      progressValue,
      completed: progressValue >= definition.targetValue,
    };
  }

  if (definition.key === "quality_sessions") {
    const progressValue = qualitySessionsThisWeek(input.sessions);
    return {
      progressValue,
      completed: progressValue >= definition.targetValue,
    };
  }

  const progressValue = input.proteinHitDays;
  return {
    progressValue,
    completed: progressValue >= definition.targetValue,
  };
}

function isChallengeTableMissing(error: {
  message?: string;
  code?: string;
}): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("community_weekly_challenge_status") ||
    message.includes("schema cache")
  );
}

export async function upsertWeeklyChallengeStatus(input: {
  userId: string;
  weekStart: string;
  bucketGoal: string;
  bucketExperience: string;
  bucketAgeCohort?: string;
  sessions: WorkoutSessionRecord[];
  plan: ProgramPlan | null;
  proteinHitDays: number;
}): Promise<void> {
  const definition = getWeeklyChallengeDefinition(input.weekStart);
  const metrics = computeChallengeMetrics({
    definition,
    sessions: input.sessions,
    plan: input.plan,
    proteinHitDays: input.proteinHitDays,
  });

  const supabase = await createClient();
  const { error } = await supabase.from("community_weekly_challenge_status").upsert(
    {
      user_id: input.userId,
      week_start: input.weekStart,
      bucket_goal: input.bucketGoal,
      bucket_experience: input.bucketExperience,
      bucket_age_cohort: input.bucketAgeCohort ?? "adult",
      challenge_key: definition.key,
      progress_value: metrics.progressValue,
      target_value: definition.targetValue,
      completed: metrics.completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,week_start" }
  );

  if (error && !isChallengeTableMissing(error)) {
    console.error("challenge status upsert failed:", error.message);
  }
}

export async function getWeeklyChallengeProgress(input: {
  userId: string;
  weekStart: string;
  bucketGoal: string;
  bucketExperience: string;
  sessions: WorkoutSessionRecord[];
  plan: ProgramPlan | null;
  proteinHitDays: number;
}): Promise<WeeklyChallengeProgress | null> {
  const definition = getWeeklyChallengeDefinition(input.weekStart);
  const metrics = computeChallengeMetrics({
    definition,
    sessions: input.sessions,
    plan: input.plan,
    proteinHitDays: input.proteinHitDays,
  });

  const supabase = await createClient();
  const { data: bucketRows, error } = await supabase
    .from("community_weekly_challenge_status")
    .select("completed")
    .eq("bucket_goal", input.bucketGoal)
    .eq("bucket_experience", input.bucketExperience)
    .eq("week_start", input.weekStart)
    .eq("challenge_key", definition.key);

  if (error && !isChallengeTableMissing(error)) {
    console.error("challenge bucket read failed:", error.message);
  }

  const rows = bucketRows ?? [];
  const bucketCompletedCount = rows.filter((row) => row.completed).length;

  return {
    definition,
    progressValue: metrics.progressValue,
    completed: metrics.completed,
    bucketCompletedCount,
    bucketParticipantCount: rows.length,
  };
}

export async function getCrewChallengeProgress(input: {
  crewMemberIds: string[];
  weekStart: string;
  targetPercent?: number;
}): Promise<CrewChallengeProgress | null> {
  if (input.crewMemberIds.length === 0) {
    return null;
  }

  const targetPercent = input.targetPercent ?? 80;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_weekly_challenge_status")
    .select("user_id, completed")
    .eq("week_start", input.weekStart)
    .in("user_id", input.crewMemberIds);

  if (error && !isChallengeTableMissing(error)) {
    console.error("crew challenge read failed:", error.message);
    return null;
  }

  const rows = data ?? [];
  const completedCount = rows.filter((row) => row.completed).length;
  const memberCount = input.crewMemberIds.length;
  const completionPct =
    memberCount > 0 ? Math.round((completedCount / memberCount) * 100) : 0;

  return {
    completedCount,
    memberCount,
    targetPercent,
    crewMetGoal: completionPct >= targetPercent,
  };
}
