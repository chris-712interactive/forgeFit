import { buildNutritionAdherence } from "@/lib/analytics/nutrition-adherence";
import { computeHabitScore } from "@forgefit/coaching";
import { hasFeature } from "@/lib/billing/gates";
import type { SubscriptionSnapshot } from "@/lib/billing/types";
import { getWeekBounds, computeWeeklyWorkStats } from "@/lib/home/weekly-stats";
import { countQualitySessionsInLookback } from "@/lib/progression/adherence";
import { getActiveProgram } from "@/lib/programs/service";
import { profileFirstName } from "@/lib/profile/identity";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import type {
  CommunityWinRow,
  GamificationContext,
  LeaderboardEntryRow,
} from "./types";

function isGamificationTableMissing(error: {
  message?: string;
  code?: string;
}): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("leaderboard_entries") ||
    message.includes("community_wins") ||
    message.includes("schema cache")
  );
}

function weekStartIso(date = new Date()): string {
  return getWeekBounds(date).startIso;
}

async function loadRecentNutritionTotals(userId: string, days = 7) {
  const supabase = await createClient();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startIso = start.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("nutrition_logs")
    .select("logged_date, calories, protein_g")
    .eq("user_id", userId)
    .gte("logged_date", startIso);

  if (error || !data) {
    return [];
  }

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

async function proteinHitDaysLast7(userId: string): Promise<number> {
  const plan = await getActiveProgram(userId);
  const targets = plan?.nutrition ?? null;
  if (!targets) {
    return 0;
  }

  const logs = await loadRecentNutritionTotals(userId, 7);
  const adherence = buildNutritionAdherence(logs, targets);
  if (!adherence) {
    return 0;
  }
  return adherence.windows.find((window) => window.days === 7)?.proteinHitDays ?? 0;
}

function leaderboardDisplayLabel(profile: {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  email?: string | null;
}): string {
  const first = profileFirstName(profile);
  if (first) return first;

  const local = profile.email?.split("@")[0]?.trim();
  if (local) return local.slice(0, 16);
  return "Forge athlete";
}

export async function upsertWeeklyLeaderboardScore(
  userId: string,
  subscription: SubscriptionSnapshot,
  sessions: WorkoutSessionRecord[]
): Promise<void> {
  if (!hasFeature(subscription, "gamification")) {
    return;
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, display_name, email, primary_goal, experience_level, gamification_opt_in"
    )
    .eq("id", userId)
    .single();

  if (!profile?.gamification_opt_in) {
    return;
  }

  const goal = profile.primary_goal;
  const experience = profile.experience_level;
  if (!goal || !experience) {
    return;
  }

  const [plan, proteinHitDays] = await Promise.all([
    getActiveProgram(userId),
    proteinHitDaysLast7(userId),
  ]);

  const weekly = computeWeeklyWorkStats(sessions, plan);
  const qualitySessions = countQualitySessionsInLookback(sessions, 4, 0.5);

  const habit = computeHabitScore({
    workoutsCompleted: weekly.workoutsCompleted,
    workoutsPlanned: weekly.workoutsPlanned,
    proteinHitDays,
    proteinWindowDays: 7,
    qualitySessions,
  });

  const weekStart = weekStartIso();
  const { error } = await supabase.from("leaderboard_entries").upsert(
    {
      user_id: userId,
      bucket_goal: goal,
      bucket_experience: experience,
      week_start: weekStart,
      habit_score: habit.score,
      display_label: leaderboardDisplayLabel(profile),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,week_start" }
  );

  if (error && !isGamificationTableMissing(error)) {
    console.error("leaderboard upsert failed:", error.message);
  }
}

export async function getGamificationContext(
  userId: string,
  subscription: SubscriptionSnapshot,
  sessions: WorkoutSessionRecord[]
): Promise<GamificationContext> {
  const unlocked = hasFeature(subscription, "gamification");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_goal, experience_level, gamification_opt_in")
    .eq("id", userId)
    .single();

  const optedIn = profile?.gamification_opt_in ?? false;

  if (!unlocked || !optedIn) {
    return {
      unlocked,
      optedIn,
      tableReady: true,
      leaderboard: [],
      communityWins: [],
      userRank: null,
      userScore: null,
    };
  }

  const goal = profile?.primary_goal;
  const experience = profile?.experience_level;
  if (!goal || !experience) {
    return {
      unlocked,
      optedIn,
      tableReady: true,
      leaderboard: [],
      communityWins: [],
      userRank: null,
      userScore: null,
    };
  }

  await upsertWeeklyLeaderboardScore(userId, subscription, sessions);

  const weekStart = weekStartIso();

  const [leaderboardResult, winsResult] = await Promise.all([
    supabase
      .from("leaderboard_entries")
      .select("user_id, display_label, habit_score")
      .eq("bucket_goal", goal)
      .eq("bucket_experience", experience)
      .eq("week_start", weekStart)
      .order("habit_score", { ascending: false })
      .limit(10),
    supabase
      .from("community_wins")
      .select("id, user_id, win_type, headline, detail, occurred_at")
      .eq("bucket_goal", goal)
      .eq("bucket_experience", experience)
      .order("occurred_at", { ascending: false })
      .limit(8),
  ]);

  const tableMissing =
    isGamificationTableMissing(leaderboardResult.error ?? {}) ||
    isGamificationTableMissing(winsResult.error ?? {});

  if (tableMissing) {
    return {
      unlocked,
      optedIn,
      tableReady: false,
      leaderboard: [],
      communityWins: [],
      userRank: null,
      userScore: null,
    };
  }

  const leaderboardRows = leaderboardResult.data ?? [];
  const leaderboard: LeaderboardEntryRow[] = leaderboardRows.map((row) => ({
    userId: row.user_id as string,
    displayLabel: row.display_label as string,
    habitScore: Number(row.habit_score),
    isCurrentUser: row.user_id === userId,
  }));

  const userIndex = leaderboard.findIndex((row) => row.isCurrentUser);
  const userRank = userIndex >= 0 ? userIndex + 1 : null;
  const userScore = userIndex >= 0 ? leaderboard[userIndex]!.habitScore : null;

  const winUserIds = [...new Set((winsResult.data ?? []).map((w) => w.user_id))];
  const labelByUserId = new Map<string, string>(
    leaderboardRows.map((row) => [row.user_id as string, row.display_label as string])
  );

  if (winUserIds.length > 0) {
    const missingIds = winUserIds.filter((id) => !labelByUserId.has(id));
    if (missingIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, display_name, email")
        .in("id", missingIds);
      for (const row of profiles ?? []) {
        labelByUserId.set(
          row.id as string,
          leaderboardDisplayLabel({
            first_name: row.first_name as string | null,
            last_name: row.last_name as string | null,
            display_name: row.display_name as string | null,
            email: row.email as string | null,
          })
        );
      }
    }
  }

  const communityWins: CommunityWinRow[] = (winsResult.data ?? []).map((row) => ({
    id: row.id as string,
    displayLabel: labelByUserId.get(row.user_id as string) ?? "Forge athlete",
    winType: row.win_type as CommunityWinRow["winType"],
    headline: row.headline as string,
    detail: (row.detail as string | null) ?? null,
    occurredAt: row.occurred_at as string,
  }));

  return {
    unlocked,
    optedIn,
    tableReady: true,
    leaderboard,
    communityWins,
    userRank,
    userScore,
  };
}

export async function recordCommunityWin(input: {
  userId: string;
  winType: CommunityWinRow["winType"];
  headline: string;
  detail?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_goal, experience_level, gamification_opt_in")
    .eq("id", input.userId)
    .single();

  if (!profile?.gamification_opt_in) {
    return;
  }

  const goal = profile.primary_goal;
  const experience = profile.experience_level;
  if (!goal || !experience) {
    return;
  }

  const { error } = await supabase.from("community_wins").insert({
    user_id: input.userId,
    win_type: input.winType,
    headline: input.headline,
    detail: input.detail ?? null,
    bucket_goal: goal,
    bucket_experience: experience,
    occurred_at: new Date().toISOString(),
  });

  if (error && !isGamificationTableMissing(error)) {
    console.error("community win insert failed:", error.message);
  }
}
