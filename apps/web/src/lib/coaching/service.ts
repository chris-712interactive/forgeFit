import { buildNutritionAdherence } from "@/lib/analytics/nutrition-adherence";
import { computeHabitScore } from "@forgefit/coaching";
import { hasFeature } from "@/lib/billing/gates";
import type { SubscriptionSnapshot } from "@/lib/billing/types";
import { getWeekBounds, computeWeeklyWorkStats } from "@/lib/home/weekly-stats";
import { countQualitySessionsInLookback } from "@/lib/progression/adherence";
import { getActiveProgram } from "@/lib/programs/service";
import { profileFirstName } from "@/lib/profile/identity";
import { createClient } from "@/lib/supabase/server";
import {
  resolveCommunityBucket,
} from "@/lib/coaching/community-bucket";
import type { WorkoutSessionRecord } from "@/lib/workouts/sessions";
import { bucketLabel as formatBucketLabel, leagueTierLabel } from "./community-labels";
import {
  buildSeasonRecap,
  ensureLeagueTier,
  fetchTierLeaderboard,
  getHallOfFame,
  getUserBadges,
  getUserLeagueTier,
} from "./community-leagues";
import type {
  CommunityWinRow,
  GamificationContext,
  HabitScoreBreakdown,
  LeaderboardEntryRow,
  LeaderboardRankDelta,
  CommunityRankSnapshot,
  WeeklyCommunityRecap,
  CommunityPageData,
  LeagueContext,
} from "./types";
import { computeTrainingStreakWeeks, highestNewStreakMilestone } from "./streak";
import {
  getCrewChallengeProgress,
  getWeeklyChallengeProgress,
  upsertWeeklyChallengeStatus,
} from "./community-challenges";
import {
  getCrewWins,
  getUserCrew,
} from "./community-crews";
import {
  getCommunityNotifications,
  getFollowStateForLeaderboard,
  getFriendsLeaderboard,
  getUnreadCommunityNotificationCount,
  getWeeklyRival,
  processRankChangeNotifications,
  processRivalNotifications,
} from "./community-social";
import {
  aggregateWinInteractions,
  applyWinInteractions,
} from "./community-reactions";
import { evaluateScoreFlags } from "./community-anti-gaming";
import {
  filterLeaderboardRows,
  loadSuspendedUserIds,
} from "./community-leaderboard-filters";
import {
  getModerationQueue,
  isCommunityModerator,
} from "./community-moderation";
import { ensureOptInVariantAssigned } from "./community-opt-in-experiment";
import { getCommunityMetrics, recordCommunityAction } from "./community-metrics";
import { buildWeeklyRecapForUser } from "./community-weekly-recap";

function baseGamificationContext(
  overrides: Partial<GamificationContext> = {}
): GamificationContext {
  return {
    unlocked: false,
    optedIn: false,
    tableReady: true,
    bucketGoal: null,
    bucketExperience: null,
    bucketLabel: null,
    bucketPeerCount: 0,
    activePeerCount: 0,
    leaderboard: [],
    communityWins: [],
    userRank: null,
    userScore: null,
    habitBreakdown: null,
    pointsToNextRank: null,
    leaderAboveLabel: null,
    weeklyRecap: null,
    weeklyRival: null,
    unreadNotificationCount: 0,
    recentNotifications: [],
    league: null,
    optInVariant: "control",
    isModerator: false,
    ...overrides,
  };
}

function rankContextFromLeaderboard(
  leaderboard: LeaderboardEntryRow[],
  userId: string
): {
  userRank: number | null;
  userScore: number | null;
  pointsToNextRank: number | null;
  leaderAboveLabel: string | null;
} {
  const userIndex = leaderboard.findIndex((row) => row.userId === userId);
  const userRank = userIndex >= 0 ? userIndex + 1 : null;
  const userScore = userIndex >= 0 ? leaderboard[userIndex]!.habitScore : null;

  if (userIndex <= 0) {
    return {
      userRank,
      userScore,
      pointsToNextRank: null,
      leaderAboveLabel: null,
    };
  }

  const leader = leaderboard[userIndex - 1]!;
  return {
    userRank,
    userScore,
    pointsToNextRank: leader.habitScore - (userScore ?? 0),
    leaderAboveLabel: leader.displayLabel,
  };
}

async function computeUserHabitBreakdown(
  userId: string,
  sessions: WorkoutSessionRecord[]
): Promise<HabitScoreBreakdown | null> {
  const plan = await getActiveProgram(userId);
  const weekly = computeWeeklyWorkStats(sessions, plan);
  const proteinHitDays = await proteinHitDaysLast7(userId);
  const qualitySessions = countQualitySessionsInLookback(sessions, 4, 0.5);
  const habit = computeHabitScore({
    workoutsCompleted: weekly.workoutsCompleted,
    workoutsPlanned: weekly.workoutsPlanned,
    proteinHitDays,
    proteinWindowDays: 7,
    qualitySessions,
  });

  return {
    score: habit.score,
    training: habit.breakdown.training,
    nutrition: habit.breakdown.nutrition,
    quality: habit.breakdown.quality,
    workoutsCompleted: weekly.workoutsCompleted,
    workoutsPlanned: weekly.workoutsPlanned,
    proteinHitDays,
    qualitySessions,
  };
}

async function fetchBucketLeaderboard(
  goal: string,
  experience: string,
  weekStart: string,
  userId: string,
  limit = 10
): Promise<LeaderboardEntryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leaderboard_entries")
    .select("user_id, display_label, habit_score, score_flagged")
    .eq("bucket_goal", goal)
    .eq("bucket_experience", experience)
    .eq("week_start", weekStart)
    .order("habit_score", { ascending: false })
    .limit(Math.max(limit, 50));

  if (error || !data) {
    return [];
  }

  const suspendedUserIds = await loadSuspendedUserIds(
    data.map((row) => row.user_id as string)
  );

  return filterLeaderboardRows(
    data.map((row) => ({
      user_id: row.user_id as string,
      display_label: row.display_label as string,
      habit_score: row.habit_score as number,
      score_flagged: row.score_flagged as boolean | null,
    })),
    suspendedUserIds,
    userId
  ).slice(0, limit);
}

function previousWeekStartIso(reference = new Date()): string {
  const { start } = getWeekBounds(reference);
  const previous = new Date(start);
  previous.setDate(previous.getDate() - 7);
  return getWeekBounds(previous).startIso;
}

async function buildWeeklyRecap(
  userId: string,
  goal: string,
  experience: string
): Promise<WeeklyCommunityRecap | null> {
  const day = new Date().getDay();
  if (day !== 1 && day !== 2) {
    return null;
  }

  return buildWeeklyRecapForUser({
    userId,
    bucketGoal: goal,
    bucketExperience: experience,
  });
}

function isGamificationTableMissing(error: {
  message?: string;
  code?: string;
}): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("leaderboard_entries") ||
    message.includes("community_wins") ||
    message.includes("community_win_cheers") ||
    message.includes("community_win_reactions") ||
    message.includes("community_win_preset_comments") ||
    message.includes("score_flagged") ||
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
      "first_name, last_name, display_name, email, primary_goal, experience_level, gamification_opt_in, community_suspended, date_of_birth, age, parent_consent_at"
    )
    .eq("id", userId)
    .single();

  if (!profile?.gamification_opt_in || profile.community_suspended) {
    return;
  }

  const goal = profile.primary_goal;
  const experience = profile.experience_level;
  if (!goal || !experience) {
    return;
  }

  const bucket = resolveCommunityBucket(profile);
  if (!bucket) {
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
  const previousWeekStart = previousWeekStartIso();

  const [previousScoreResult, nutritionLogs] = await Promise.all([
    supabase
      .from("leaderboard_entries")
      .select("habit_score")
      .eq("user_id", userId)
      .eq("week_start", previousWeekStart)
      .maybeSingle(),
    loadRecentNutritionTotals(userId, 7),
  ]);

  const scoreFlags = evaluateScoreFlags({
    habitScore: habit.score,
    workoutsCompleted: weekly.workoutsCompleted,
    workoutsPlanned: weekly.workoutsPlanned,
    proteinHitDays,
    nutritionLogDays: nutritionLogs.length,
    qualitySessions,
    previousWeekScore:
      previousScoreResult.data?.habit_score != null
        ? Number(previousScoreResult.data.habit_score)
        : null,
    sessions,
  });

  const { error } = await supabase.from("leaderboard_entries").upsert(
    {
      user_id: userId,
      bucket_goal: bucket.bucketGoal,
      bucket_experience: bucket.bucketExperience,
      bucket_age_cohort: bucket.bucketAgeCohort,
      week_start: weekStart,
      habit_score: habit.score,
      display_label: leaderboardDisplayLabel(profile),
      score_flagged: scoreFlags.flagged,
      flag_reason: scoreFlags.reason,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,week_start" }
  );

  if (error && !isGamificationTableMissing(error)) {
    console.error("leaderboard upsert failed:", error.message);
  } else if (!error) {
    void recordCommunityAction(userId, "score_upsert");
  }

  await ensureLeagueTier({
    userId,
    bucketGoal: bucket.bucketGoal,
    bucketExperience: bucket.bucketExperience,
    bucketAgeCohort: bucket.bucketAgeCohort,
  });

  await upsertWeeklyChallengeStatus({
    userId,
    weekStart,
    bucketGoal: bucket.bucketGoal,
    bucketExperience: bucket.bucketExperience,
    bucketAgeCohort: bucket.bucketAgeCohort,
    sessions,
    plan,
    proteinHitDays,
  });
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
    .select(
      "primary_goal, experience_level, gamification_opt_in, community_opt_in_variant, is_community_moderator, date_of_birth, age, parent_consent_at"
    )
    .eq("id", userId)
    .single();

  const optedIn = profile?.gamification_opt_in ?? false;
  const optInVariant = await ensureOptInVariantAssigned({
    userId,
    storedVariant: profile?.community_opt_in_variant,
    optedIn,
  });
  const isModerator = isCommunityModerator({
    userId,
    profileFlag: profile?.is_community_moderator,
  });
  const goal = profile?.primary_goal ?? null;
  const experience = profile?.experience_level ?? null;
  const bucket = profile ? resolveCommunityBucket(profile) : null;
  const bucketLabelValue = formatBucketLabel(goal, experience);

  if (!unlocked) {
    return baseGamificationContext({ unlocked: false, optedIn });
  }

  if (!goal || !experience || !bucket) {
    return baseGamificationContext({
      unlocked: true,
      optedIn,
      bucketGoal: goal,
      bucketExperience: experience,
      bucketLabel: bucketLabelValue,
    });
  }

  if (optedIn) {
    await upsertWeeklyLeaderboardScore(userId, subscription, sessions);
  }

  const weekStart = weekStartIso();
  const ageCohort = bucket.bucketAgeCohort;

  const userTier = optedIn ? await getUserLeagueTier(userId) : null;
  const effectiveTier = userTier ?? "bronze";

  const [
    leaderboardResult,
    tierLeaderboard,
    peerCountResult,
    activeWeekCountResult,
    winsResult,
  ] = await Promise.all([
    supabase
      .from("leaderboard_entries")
      .select("user_id, display_label, habit_score, score_flagged")
      .eq("bucket_goal", goal)
      .eq("bucket_experience", experience)
      .eq("bucket_age_cohort", ageCohort)
      .eq("week_start", weekStart)
      .order("habit_score", { ascending: false })
      .limit(50),
    optedIn
      ? fetchTierLeaderboard({
          bucketGoal: goal,
          bucketExperience: experience,
          tier: effectiveTier,
          weekStart,
          userId,
          limit: 50,
        })
      : Promise.resolve([]),
    supabase
      .from("leaderboard_entries")
      .select("user_id", { count: "exact", head: true })
      .eq("bucket_goal", goal)
      .eq("bucket_experience", experience)
      .eq("bucket_age_cohort", ageCohort),
    supabase
      .from("leaderboard_entries")
      .select("user_id", { count: "exact", head: true })
      .eq("bucket_goal", goal)
      .eq("bucket_experience", experience)
      .eq("bucket_age_cohort", ageCohort)
      .eq("week_start", weekStart),
    supabase
      .from("community_wins")
      .select("id, user_id, win_type, headline, detail, occurred_at")
      .eq("bucket_goal", goal)
      .eq("bucket_experience", experience)
      .eq("bucket_age_cohort", ageCohort)
      .is("hidden_at", null)
      .order("occurred_at", { ascending: false })
      .limit(8),
  ]);

  const tableMissing =
    isGamificationTableMissing(leaderboardResult.error ?? {}) ||
    isGamificationTableMissing(peerCountResult.error ?? {}) ||
    isGamificationTableMissing(activeWeekCountResult.error ?? {}) ||
    isGamificationTableMissing(winsResult.error ?? {});

  if (tableMissing) {
    return baseGamificationContext({
      unlocked: true,
      optedIn,
      tableReady: false,
      bucketGoal: goal,
      bucketExperience: experience,
      bucketLabel: bucketLabelValue,
    });
  }

  const leaderboardRowsRaw = leaderboardResult.data ?? [];
  const suspendedUserIds = await loadSuspendedUserIds(
    leaderboardRowsRaw.map((row) => row.user_id as string)
  );
  const leaderboardRows = filterLeaderboardRows(
    leaderboardRowsRaw.map((row) => ({
      user_id: row.user_id as string,
      display_label: row.display_label as string,
      habit_score: row.habit_score as number,
      score_flagged: row.score_flagged as boolean | null,
    })),
    suspendedUserIds,
    userId
  );
  const previewLeaderboard: LeaderboardEntryRow[] = leaderboardRows;

  const rankLeaderboard = optedIn && tierLeaderboard.length > 0
    ? tierLeaderboard
    : previewLeaderboard.slice(0, 10);

  const rankContext = rankContextFromLeaderboard(rankLeaderboard, userId);

  const winRows = winsResult.data ?? [];
  const winUserIds = [...new Set(winRows.map((w) => w.user_id as string))];
  const labelByUserId = new Map<string, string>(
    leaderboardRows.map((row) => [row.userId, row.displayLabel])
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

  const winIds = winRows.map((row) => row.id as string);
  const cheerCountByWinId = new Map<string, number>();
  const cheeredWinIds = new Set<string>();

  let communityWins: CommunityWinRow[] = winRows.map((row) => {
    const winUserId = row.user_id as string;
    const winId = row.id as string;
    return {
      id: winId,
      userId: winUserId,
      displayLabel: labelByUserId.get(winUserId) ?? "Forge athlete",
      winType: row.win_type as CommunityWinRow["winType"],
      headline: row.headline as string,
      detail: (row.detail as string | null) ?? null,
      occurredAt: row.occurred_at as string,
      cheerCount: 0,
      cheeredByMe: false,
      isCurrentUser: winUserId === userId,
    };
  });

  if (winIds.length > 0) {
    const [
      { data: cheers, error: cheersError },
      { data: reactions, error: reactionsError },
      { data: comments, error: commentsError },
    ] = await Promise.all([
      supabase
        .from("community_win_cheers")
        .select("win_id, user_id")
        .in("win_id", winIds),
      supabase
        .from("community_win_reactions")
        .select("win_id, user_id, reaction_key")
        .in("win_id", winIds),
      supabase
        .from("community_win_preset_comments")
        .select("win_id, user_id, comment_key")
        .in("win_id", winIds),
    ]);

    if (!cheersError || !isGamificationTableMissing(cheersError)) {
      for (const cheer of cheers ?? []) {
        const winId = cheer.win_id as string;
        cheerCountByWinId.set(winId, (cheerCountByWinId.get(winId) ?? 0) + 1);
        if (cheer.user_id === userId) {
          cheeredWinIds.add(winId);
        }
      }
    }

    communityWins = communityWins.map((win) => ({
      ...win,
      cheerCount: cheerCountByWinId.get(win.id) ?? 0,
      cheeredByMe: cheeredWinIds.has(win.id),
    }));

    const reactionsMissing =
      reactionsError && isGamificationTableMissing(reactionsError);
    const commentsMissing =
      commentsError && isGamificationTableMissing(commentsError);
    const canEnrichInteractions =
      (!reactionsError || reactionsMissing) && (!commentsError || commentsMissing);

    if (canEnrichInteractions && !reactionsError && !commentsError) {
      const interactionAggregates = aggregateWinInteractions(
        winIds,
        reactions ?? [],
        comments ?? [],
        userId
      );
      communityWins = applyWinInteractions(communityWins, interactionAggregates);
    }
  }

  const activePeerCount = activeWeekCountResult.count ?? 0;
  const bucketPeerCount = peerCountResult.count ?? activePeerCount;

  const [habitBreakdown, weeklyRecap, weeklyRival, unreadNotificationCount, recentNotifications, seasonRecap, badges, hallOfFame] =
    optedIn
    ? await Promise.all([
        computeUserHabitBreakdown(userId, sessions),
        buildWeeklyRecap(userId, goal, experience),
        getWeeklyRival(
          userId,
          weekStart,
          rankLeaderboard.length > 0
            ? rankLeaderboard
            : await fetchBucketLeaderboard(goal, experience, weekStart, userId, 100)
        ),
        getUnreadCommunityNotificationCount(userId),
        getCommunityNotifications(userId, 5),
        buildSeasonRecap(userId, goal, experience),
        getUserBadges(userId),
        getHallOfFame({
          bucketGoal: goal,
          bucketExperience: experience,
          userId,
        }),
      ])
    : [null, null, null, 0, [], null, [], []];

  const league: LeagueContext | null =
    optedIn && userTier
      ? {
          tier: effectiveTier,
          tierLabel: leagueTierLabel(effectiveTier),
          tierPeerCount: tierLeaderboard.length,
          seasonRecap: seasonRecap
            ? { ...seasonRecap, bucketLabel: bucketLabelValue }
            : null,
          badges,
          hallOfFame,
        }
      : optedIn
        ? {
            tier: "bronze",
            tierLabel: leagueTierLabel("bronze"),
            tierPeerCount: tierLeaderboard.length,
            seasonRecap: seasonRecap
              ? { ...seasonRecap, bucketLabel: bucketLabelValue }
              : null,
            badges,
            hallOfFame,
          }
        : null;

  return {
    unlocked: true,
    optedIn,
    tableReady: true,
    bucketGoal: goal,
    bucketExperience: experience,
    bucketLabel: bucketLabelValue,
    bucketPeerCount,
    activePeerCount,
    leaderboard: rankLeaderboard.slice(0, 10),
    communityWins,
    userRank: rankContext.userRank,
    userScore: rankContext.userScore,
    habitBreakdown,
    pointsToNextRank: rankContext.pointsToNextRank,
    leaderAboveLabel: rankContext.leaderAboveLabel,
    weeklyRecap,
    weeklyRival,
    unreadNotificationCount,
    recentNotifications,
    league,
    optInVariant,
    isModerator,
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
    .select("primary_goal, experience_level, gamification_opt_in, date_of_birth, age")
    .eq("id", input.userId)
    .single();

  if (!profile?.gamification_opt_in) {
    return;
  }

  const bucket = resolveCommunityBucket(profile);
  if (!bucket) {
    return;
  }

  const { error } = await supabase.from("community_wins").insert({
    user_id: input.userId,
    win_type: input.winType,
    headline: input.headline,
    detail: input.detail ?? null,
    bucket_goal: bucket.bucketGoal,
    bucket_experience: bucket.bucketExperience,
    bucket_age_cohort: bucket.bucketAgeCohort,
    occurred_at: new Date().toISOString(),
  });

  if (error && !isGamificationTableMissing(error)) {
    console.error("community win insert failed:", error.message);
  }
}

export async function publishCommunityMilestoneWins(
  userId: string,
  sessions: WorkoutSessionRecord[]
): Promise<void> {
  const plan = await getActiveProgram(userId);
  const weekly = computeWeeklyWorkStats(sessions, plan);
  const { startIso } = getWeekBounds();

  const supabase = await createClient();

  if (
    weekly.workoutsPlanned > 0 &&
    weekly.workoutsCompleted >= weekly.workoutsPlanned
  ) {
    const { data: existingPlanWin } = await supabase
      .from("community_wins")
      .select("id")
      .eq("user_id", userId)
      .eq("win_type", "weekly_plan")
      .gte("occurred_at", `${startIso}T00:00:00.000Z`)
      .limit(1)
      .maybeSingle();

    if (!existingPlanWin) {
      await recordCommunityWin({
        userId,
        winType: "weekly_plan",
        headline: "Weekly plan complete",
        detail: `${weekly.workoutsCompleted}/${weekly.workoutsPlanned} workouts logged this week`,
      });
    }
  }

  const streakWeeks = computeTrainingStreakWeeks(sessions, plan);
  if (streakWeeks < 4) {
    return;
  }

  const { data: streakWins, error } = await supabase
    .from("community_wins")
    .select("detail")
    .eq("user_id", userId)
    .eq("win_type", "streak");

  if (error && !isGamificationTableMissing(error)) {
    console.error("streak win lookup failed:", error.message);
    return;
  }

  const publishedMilestones = (streakWins ?? [])
    .map((row) => {
      const match = (row.detail as string | null)?.match(/(\d+)-week/);
      return match ? Number(match[1]) : null;
    })
    .filter((value): value is number => value != null);

  const milestone = highestNewStreakMilestone(streakWeeks, publishedMilestones);
  if (milestone == null) {
    return;
  }

  await recordCommunityWin({
    userId,
    winType: "streak",
    headline: `${milestone}-week training streak`,
    detail: `${milestone}-week streak — every planned workout completed`,
  });
}

export async function syncLeaderboardAfterWorkout(
  userId: string,
  subscription: SubscriptionSnapshot,
  sessions: WorkoutSessionRecord[]
): Promise<LeaderboardRankDelta | null> {
  if (!hasFeature(subscription, "gamification")) {
    return null;
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
    return null;
  }

  const goal = profile.primary_goal;
  const experience = profile.experience_level;
  if (!goal || !experience) {
    return null;
  }

  const weekStart = weekStartIso();
  const userTier = (await getUserLeagueTier(userId)) ?? "bronze";

  async function loadTierBoard() {
    const board = await fetchTierLeaderboard({
      bucketGoal: goal,
      bucketExperience: experience,
      tier: userTier,
      weekStart,
      userId,
      limit: 100,
    });
    if (board.length > 0) return board;
    return fetchBucketLeaderboard(goal, experience, weekStart, userId, 100);
  }

  const beforeBoard = await loadTierBoard();
  const before = rankContextFromLeaderboard(beforeBoard, userId);

  await upsertWeeklyLeaderboardScore(userId, subscription, sessions);
  await publishCommunityMilestoneWins(userId, sessions);

  const afterBoard = await loadTierBoard();
  const after = rankContextFromLeaderboard(afterBoard, userId);

  const rankChange =
    before.userRank != null && after.userRank != null
      ? before.userRank - after.userRank
      : after.userRank != null && before.userRank == null
        ? null
        : null;

  const actorDisplayLabel = leaderboardDisplayLabel(profile);
  const weeklyRival = await getWeeklyRival(userId, weekStart, afterBoard);

  await processRankChangeNotifications({
    actorUserId: userId,
    actorDisplayLabel,
    beforeBoard,
    afterBoard,
    pointsToNextRank: after.pointsToNextRank,
    leaderAboveLabel: after.leaderAboveLabel,
  });

  await processRivalNotifications({
    userId,
    rival: weeklyRival,
    beforeBoard,
    afterBoard,
  });

  return {
    previousRank: before.userRank,
    newRank: after.userRank,
    previousScore: before.userScore,
    newScore: after.userScore,
    rankChange,
    pointsToNextRank: after.pointsToNextRank,
    leaderAboveLabel: after.leaderAboveLabel,
  };
}

export async function getCommunityRankSnapshot(
  userId: string,
  subscription: SubscriptionSnapshot,
  sessions: WorkoutSessionRecord[]
): Promise<CommunityRankSnapshot | null> {
  const unlocked = hasFeature(subscription, "gamification");
  if (!unlocked) {
    return null;
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_goal, experience_level, gamification_opt_in")
    .eq("id", userId)
    .single();

  const goal = profile?.primary_goal;
  const experience = profile?.experience_level;
  const bucketLabelValue = formatBucketLabel(goal, experience);

  if (!goal || !experience) {
    return {
      unlocked: true,
      optedIn: profile?.gamification_opt_in ?? false,
      bucketLabel: bucketLabelValue,
      userRank: null,
      userScore: null,
      pointsToNextRank: null,
      leaderAboveLabel: null,
      activePeerCount: 0,
      weeklyRival: null,
    };
  }

  if (profile?.gamification_opt_in) {
    await upsertWeeklyLeaderboardScore(userId, subscription, sessions);
  }

  const weekStart = weekStartIso();
  const userTier = (await getUserLeagueTier(userId)) ?? "bronze";

  const tierBoard = profile?.gamification_opt_in
    ? await fetchTierLeaderboard({
        bucketGoal: goal,
        bucketExperience: experience,
        tier: userTier,
        weekStart,
        userId,
        limit: 100,
      })
    : [];

  const [leaderboard, countResult] = await Promise.all([
    tierBoard.length > 0
      ? Promise.resolve(tierBoard)
      : fetchBucketLeaderboard(goal, experience, weekStart, userId, 100),
    supabase
      .from("leaderboard_entries")
      .select("user_id", { count: "exact", head: true })
      .eq("bucket_goal", goal)
      .eq("bucket_experience", experience)
      .eq("week_start", weekStart),
  ]);

  const rankContext = rankContextFromLeaderboard(leaderboard, userId);
  const weeklyRival = profile?.gamification_opt_in
    ? await getWeeklyRival(userId, weekStart, leaderboard)
    : null;

  return {
    unlocked: true,
    optedIn: profile?.gamification_opt_in ?? false,
    bucketLabel: bucketLabelValue,
    userRank: rankContext.userRank,
    userScore: rankContext.userScore,
    pointsToNextRank: rankContext.pointsToNextRank,
    leaderAboveLabel: rankContext.leaderAboveLabel,
    activePeerCount: countResult.count ?? leaderboard.length,
    weeklyRival,
  };
}

export async function getCommunityPageData(
  userId: string,
  subscription: SubscriptionSnapshot,
  sessions: WorkoutSessionRecord[]
): Promise<CommunityPageData> {
  const gamification = await getGamificationContext(
    userId,
    subscription,
    sessions
  );

  if (
    !gamification.unlocked ||
    !gamification.bucketGoal ||
    !gamification.bucketExperience
  ) {
    return {
      gamification,
      fullLeaderboard: [],
      totalRankedThisWeek: 0,
      friendsLeaderboard: [],
      followState: {},
      notifications: [],
      unreadNotificationCount: 0,
      crew: null,
      weeklyChallenge: null,
      crewChallenge: null,
      crewWins: [],
      moderationQueue: null,
      communityMetrics: null,
    };
  }

  const weekStart = weekStartIso();
  const userTier = gamification.optedIn
    ? (gamification.league?.tier ?? "bronze")
    : "bronze";

  const fullLeaderboard = gamification.optedIn
    ? await fetchTierLeaderboard({
        bucketGoal: gamification.bucketGoal,
        bucketExperience: gamification.bucketExperience,
        tier: userTier,
        weekStart,
        userId,
        limit: 50,
      })
    : await fetchBucketLeaderboard(
        gamification.bucketGoal,
        gamification.bucketExperience,
        weekStart,
        userId,
        50
      );

  const plan = gamification.optedIn ? await getActiveProgram(userId) : null;
  const proteinHitDays = gamification.optedIn
    ? await proteinHitDaysLast7(userId)
    : 0;

  const [friendsLeaderboard, followStateMap, notifications, unreadNotificationCount, crew] =
    gamification.optedIn
      ? await Promise.all([
          getFriendsLeaderboard(userId, fullLeaderboard),
          getFollowStateForLeaderboard(userId, fullLeaderboard),
          getCommunityNotifications(userId, 20),
          getUnreadCommunityNotificationCount(userId),
          getUserCrew(userId),
        ])
      : [[], new Map(), [], 0, null];

  const weeklyChallenge = gamification.optedIn
    ? await getWeeklyChallengeProgress({
        userId,
        weekStart,
        bucketGoal: gamification.bucketGoal,
        bucketExperience: gamification.bucketExperience,
        sessions,
        plan,
        proteinHitDays,
      })
    : null;

  const crewMemberIds = crew?.members.map((member) => member.userId) ?? [];
  const crewChallenge =
    crew && gamification.optedIn
      ? await getCrewChallengeProgress({
          crewMemberIds,
          weekStart,
        })
      : null;

  const crewWins =
    crew && gamification.optedIn
      ? await getCrewWins(
          crewMemberIds,
          gamification.bucketGoal,
          gamification.bucketExperience,
          userId
        )
      : [];

  const followState = Object.fromEntries(followStateMap.entries());

  const weeklyChallengeView = weeklyChallenge
    ? {
        key: weeklyChallenge.definition.key,
        title: weeklyChallenge.definition.title,
        description: weeklyChallenge.definition.description,
        targetValue: weeklyChallenge.definition.targetValue,
        unit: weeklyChallenge.definition.unit,
        progressValue: weeklyChallenge.progressValue,
        completed: weeklyChallenge.completed,
        bucketCompletedCount: weeklyChallenge.bucketCompletedCount,
        bucketParticipantCount: weeklyChallenge.bucketParticipantCount,
      }
    : null;

  const recap = gamification.weeklyRecap;
  if (recap && crew) {
    recap.crewName = crew.name;
  }

  const [moderationQueue, communityMetrics] =
    gamification.isModerator &&
    gamification.bucketGoal &&
    gamification.bucketExperience
      ? await Promise.all([
          getModerationQueue({
            bucketGoal: gamification.bucketGoal,
            bucketExperience: gamification.bucketExperience,
            weekStart,
          }),
          getCommunityMetrics(),
        ])
      : [null, null];

  return {
    gamification: {
      ...gamification,
      unreadNotificationCount,
      weeklyRecap: recap,
    },
    fullLeaderboard,
    totalRankedThisWeek: gamification.activePeerCount,
    friendsLeaderboard,
    followState,
    notifications,
    unreadNotificationCount,
    crew,
    weeklyChallenge: weeklyChallengeView,
    crewChallenge,
    crewWins,
    moderationQueue,
    communityMetrics,
  };
}
