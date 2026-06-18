import { createClient } from "@/lib/supabase/server";
import type { LeaderboardEntryRow } from "./types";
import { buildRivalRow, pickWeeklyRivalUserId } from "./rival-matching";

export type CommunityNotificationType =
  | "rank_passed"
  | "close_to_pass"
  | "rival_ahead"
  | "rival_passed_you"
  | "cheer_received"
  | "follow_mutual";

export interface WeeklyRivalRow {
  userId: string;
  displayLabel: string;
  habitScore: number;
  rank: number;
  pointsGap: number;
  isAhead: boolean;
}

export interface CommunityFollowRow {
  userId: string;
  displayLabel: string;
  habitScore: number | null;
  rank: number | null;
  isMutual: boolean;
  following: boolean;
}

export interface CommunityNotificationRow {
  id: string;
  type: CommunityNotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  payload: Record<string, unknown>;
}

function isSocialTableMissing(error: {
  message?: string;
  code?: string;
}): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("community_follows") ||
    message.includes("community_rivals") ||
    message.includes("community_notifications") ||
    message.includes("schema cache")
  );
}

export async function insertCommunityNotification(input: {
  userId: string;
  type: CommunityNotificationType;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("community_notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    payload: input.payload ?? {},
  });

  if (error && !isSocialTableMissing(error)) {
    console.error("community notification insert failed:", error.message);
  }
}

export async function ensureWeeklyRival(
  userId: string,
  weekStart: string,
  leaderboard: LeaderboardEntryRow[]
): Promise<string | null> {
  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("community_rivals")
    .select("rival_user_id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (readError && !isSocialTableMissing(readError)) {
    console.error("community rival read failed:", readError.message);
    return null;
  }

  if (existing?.rival_user_id) {
    return existing.rival_user_id as string;
  }

  const rivalUserId = pickWeeklyRivalUserId(userId, leaderboard);
  if (!rivalUserId) {
    return null;
  }

  const { error: insertError } = await supabase.from("community_rivals").insert({
    user_id: userId,
    rival_user_id: rivalUserId,
    week_start: weekStart,
  });

  if (insertError && !isSocialTableMissing(insertError)) {
    console.error("community rival insert failed:", insertError.message);
    return rivalUserId;
  }

  return rivalUserId;
}

export async function getWeeklyRival(
  userId: string,
  weekStart: string,
  leaderboard: LeaderboardEntryRow[]
): Promise<WeeklyRivalRow | null> {
  const rivalUserId = await ensureWeeklyRival(userId, weekStart, leaderboard);
  if (!rivalUserId) {
    return null;
  }

  return buildRivalRow(userId, rivalUserId, leaderboard);
}

export async function getFollowingUserIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_follows")
    .select("followee_id")
    .eq("follower_id", userId);

  if (error || !data) {
    if (error && !isSocialTableMissing(error)) {
      console.error("community follows read failed:", error.message);
    }
    return new Set();
  }

  return new Set(data.map((row) => row.followee_id as string));
}

export async function getFollowerUserIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_follows")
    .select("follower_id")
    .eq("followee_id", userId);

  if (error || !data) {
    if (error && !isSocialTableMissing(error)) {
      console.error("community followers read failed:", error.message);
    }
    return new Set();
  }

  return new Set(data.map((row) => row.follower_id as string));
}

export async function getFriendsLeaderboard(
  userId: string,
  leaderboard: LeaderboardEntryRow[]
): Promise<CommunityFollowRow[]> {
  const [following, followers] = await Promise.all([
    getFollowingUserIds(userId),
    getFollowerUserIds(userId),
  ]);

  const mutualIds = [...following].filter((id) => followers.has(id));
  if (mutualIds.length === 0) {
    return [];
  }

  const rankByUserId = new Map(
    leaderboard.map((row, index) => [row.userId, index + 1])
  );
  const scoreByUserId = new Map(
    leaderboard.map((row) => [row.userId, row.habitScore])
  );
  const labelByUserId = new Map(
    leaderboard.map((row) => [row.userId, row.displayLabel])
  );

  const missingIds = mutualIds.filter((id) => !labelByUserId.has(id));
  if (missingIds.length > 0) {
    const supabase = await createClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, display_name, email")
      .in("id", missingIds);

    for (const row of profiles ?? []) {
      const first = row.first_name as string | null;
      const label =
        first ??
        (row.display_name as string | null) ??
        (row.email as string | null)?.split("@")[0] ??
        "Forge athlete";
      labelByUserId.set(row.id as string, label);
    }
  }

  return mutualIds
    .map((friendId) => ({
      userId: friendId,
      displayLabel: labelByUserId.get(friendId) ?? "Forge athlete",
      habitScore: scoreByUserId.get(friendId) ?? null,
      rank: rankByUserId.get(friendId) ?? null,
      isMutual: true,
      following: true,
    }))
    .sort((a, b) => {
      if (a.rank == null && b.rank == null) return 0;
      if (a.rank == null) return 1;
      if (b.rank == null) return -1;
      return a.rank - b.rank;
    });
}

export async function getFollowStateForLeaderboard(
  userId: string,
  leaderboard: LeaderboardEntryRow[]
): Promise<Map<string, { following: boolean; isMutual: boolean }>> {
  const [following, followers] = await Promise.all([
    getFollowingUserIds(userId),
    getFollowerUserIds(userId),
  ]);

  const state = new Map<string, { following: boolean; isMutual: boolean }>();
  for (const entry of leaderboard) {
    if (entry.userId === userId) continue;
    const isFollowing = following.has(entry.userId);
    state.set(entry.userId, {
      following: isFollowing,
      isMutual: isFollowing && followers.has(entry.userId),
    });
  }
  return state;
}

export async function getCommunityNotifications(
  userId: string,
  limit = 20
): Promise<CommunityNotificationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("community_notifications")
    .select("id, type, title, body, payload, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error && !isSocialTableMissing(error)) {
      console.error("community notifications read failed:", error.message);
    }
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    type: row.type as CommunityNotificationType,
    title: row.title as string,
    body: row.body as string,
    read: row.read_at != null,
    createdAt: row.created_at as string,
    payload: (row.payload as Record<string, unknown>) ?? {},
  }));
}

export async function getUnreadCommunityNotificationCount(
  userId: string
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("community_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    if (!isSocialTableMissing(error)) {
      console.error("community notification count failed:", error.message);
    }
    return 0;
  }

  return count ?? 0;
}

export async function markCommunityNotificationRead(
  userId: string,
  notificationId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("community_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);

  return !error;
}

export async function markAllCommunityNotificationsRead(
  userId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("community_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error && !isSocialTableMissing(error)) {
    console.error("community notifications mark-all failed:", error.message);
  }
}

export async function toggleCommunityFollow(
  followerId: string,
  followeeId: string
): Promise<{ following: boolean; isMutual: boolean; error?: string }> {
  if (followerId === followeeId) {
    return { following: false, isMutual: false, error: "Cannot follow yourself." };
  }

  const supabase = await createClient();

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, primary_goal, experience_level, gamification_opt_in")
    .in("id", [followerId, followeeId]);

  if (profileError) {
    return { following: false, isMutual: false, error: profileError.message };
  }

  const follower = profiles?.find((row) => row.id === followerId);
  const followee = profiles?.find((row) => row.id === followeeId);

  if (!follower?.gamification_opt_in) {
    return {
      following: false,
      isMutual: false,
      error: "Join community in Profile to follow peers.",
    };
  }

  if (!follower.primary_goal || !follower.experience_level) {
    return {
      following: false,
      isMutual: false,
      error: "Complete onboarding with your goal and experience first.",
    };
  }

  if (!followee) {
    return { following: false, isMutual: false, error: "Athlete not found." };
  }

  if (
    follower.primary_goal !== followee.primary_goal ||
    follower.experience_level !== followee.experience_level
  ) {
    return {
      following: false,
      isMutual: false,
      error: "You can only follow athletes in your goal and experience bucket.",
    };
  }

  const { data: existing, error: readError } = await supabase
    .from("community_follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("followee_id", followeeId)
    .maybeSingle();

  if (readError) {
    if (isSocialTableMissing(readError)) {
      return {
        following: false,
        isMutual: false,
        error: "Apply the community social migration to enable follows.",
      };
    }
    return { following: false, isMutual: false, error: readError.message };
  }

  if (existing) {
    const { error } = await supabase
      .from("community_follows")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return { following: true, isMutual: false, error: error.message };
    }

    return { following: false, isMutual: false };
  }

  const { error } = await supabase.from("community_follows").insert({
    follower_id: followerId,
    followee_id: followeeId,
  });

  if (error) {
    const message = error.message.toLowerCase().includes("row-level security")
      ? "Could not follow — check that community migrations are applied and you are opted in."
      : error.message;
    return { following: false, isMutual: false, error: message };
  }

  const { data: reverseFollow } = await supabase
    .from("community_follows")
    .select("id")
    .eq("follower_id", followeeId)
    .eq("followee_id", followerId)
    .maybeSingle();

  const isMutual = Boolean(reverseFollow);

  if (isMutual) {
    const [followerLabel, followeeLabel] = await Promise.all([
      resolveDisplayLabel(followerId),
      resolveDisplayLabel(followeeId),
    ]);

    await Promise.all([
      insertCommunityNotification({
        userId: followerId,
        type: "follow_mutual",
        title: "New training friend",
        body: `${followeeLabel} followed you back — you will see each other on the friends board.`,
        payload: { friendUserId: followeeId },
      }),
      insertCommunityNotification({
        userId: followeeId,
        type: "follow_mutual",
        title: "New training friend",
        body: `${followerLabel} followed you back — you will see each other on the friends board.`,
        payload: { friendUserId: followerId },
      }),
    ]);
  }

  return { following: true, isMutual };
}

async function resolveDisplayLabel(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("first_name, display_name, email")
    .eq("id", userId)
    .single();

  return (
    (data?.first_name as string | null) ??
    (data?.display_name as string | null) ??
    (data?.email as string | null)?.split("@")[0] ??
    "A Forge athlete"
  );
}

export async function processRankChangeNotifications(input: {
  actorUserId: string;
  actorDisplayLabel: string;
  beforeBoard: LeaderboardEntryRow[];
  afterBoard: LeaderboardEntryRow[];
  pointsToNextRank: number | null;
  leaderAboveLabel: string | null;
}): Promise<void> {
  const newIdx = input.afterBoard.findIndex((row) => row.userId === input.actorUserId);
  const oldIdx = input.beforeBoard.findIndex((row) => row.userId === input.actorUserId);

  if (newIdx >= 0 && oldIdx >= 0 && newIdx < oldIdx) {
    for (let index = newIdx + 1; index <= oldIdx; index += 1) {
      const passed = input.afterBoard[index];
      if (!passed || passed.userId === input.actorUserId) continue;

      await insertCommunityNotification({
        userId: passed.userId,
        type: "rank_passed",
        title: "Someone passed you",
        body: `${input.actorDisplayLabel} moved ahead — you are now #${index + 1} in your bucket.`,
        payload: {
          actorUserId: input.actorUserId,
          newRank: index + 1,
        },
      });
    }
  }

  if (
    input.pointsToNextRank != null &&
    input.pointsToNextRank > 0 &&
    input.pointsToNextRank <= 3 &&
    input.leaderAboveLabel
  ) {
    await insertCommunityNotification({
      userId: input.actorUserId,
      type: "close_to_pass",
      title: "Within striking distance",
      body: `${input.pointsToNextRank} pts to pass ${input.leaderAboveLabel} — one solid session could do it.`,
      payload: {
        pointsToNextRank: input.pointsToNextRank,
        leaderAboveLabel: input.leaderAboveLabel,
      },
    });
  }
}

export async function processRivalNotifications(input: {
  userId: string;
  rival: WeeklyRivalRow | null;
  beforeBoard: LeaderboardEntryRow[];
  afterBoard: LeaderboardEntryRow[];
}): Promise<void> {
  if (!input.rival) return;

  const beforeUser = input.beforeBoard.find((row) => row.userId === input.userId);
  const afterUser = input.afterBoard.find((row) => row.userId === input.userId);
  const beforeRival = input.beforeBoard.find(
    (row) => row.userId === input.rival!.userId
  );
  const afterRival = input.afterBoard.find(
    (row) => row.userId === input.rival!.userId
  );

  if (!beforeUser || !afterUser || !beforeRival || !afterRival) {
    return;
  }

  const userGapBefore = beforeUser.habitScore - beforeRival.habitScore;
  const userGapAfter = afterUser.habitScore - afterRival.habitScore;

  if (userGapBefore <= 0 && userGapAfter > 0) {
    await insertCommunityNotification({
      userId: input.userId,
      type: "rival_ahead",
      title: "You passed your rival",
      body: `You are now ${userGapAfter} pts ahead of ${input.rival.displayLabel}.`,
      payload: { rivalUserId: input.rival.userId },
    });

    await insertCommunityNotification({
      userId: input.rival.userId,
      type: "rival_passed_you",
      title: "Your rival passed you",
      body: `${afterUser.displayLabel} pulled ahead in your weekly matchup.`,
      payload: { rivalUserId: input.userId },
    });
  }
}

export async function notifyCheerReceived(input: {
  winOwnerUserId: string;
  cheererLabel: string;
  winHeadline: string;
}): Promise<void> {
  await insertCommunityNotification({
    userId: input.winOwnerUserId,
    type: "cheer_received",
    title: "Cheer received",
    body: `${input.cheererLabel} cheered your win: ${input.winHeadline}`,
    payload: {},
  });
}
