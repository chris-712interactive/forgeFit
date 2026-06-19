import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface FlaggedScoreRow {
  userId: string;
  displayLabel: string;
  habitScore: number;
  flagReason: string | null;
  weekStart: string;
}

export interface ModerationWinRow {
  id: string;
  userId: string;
  displayLabel: string;
  headline: string;
  occurredAt: string;
  hiddenAt: string | null;
}

export interface ModerationQueue {
  flaggedScores: FlaggedScoreRow[];
  recentWins: ModerationWinRow[];
}

function moderatorIdsFromEnv(): Set<string> {
  const raw = process.env.COMMUNITY_MODERATOR_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

export function isCommunityModerator(input: {
  userId: string;
  profileFlag?: boolean | null;
}): boolean {
  if (input.profileFlag) return true;
  return moderatorIdsFromEnv().has(input.userId);
}

async function writeModerationLog(input: {
  moderatorId: string;
  action: string;
  targetUserId?: string | null;
  targetWinId?: string | null;
  note?: string | null;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("community_moderation_log").insert({
      moderator_id: input.moderatorId,
      action: input.action,
      target_user_id: input.targetUserId ?? null,
      target_win_id: input.targetWinId ?? null,
      note: input.note ?? null,
    });
  } catch (error) {
    console.error("moderation log insert failed:", error);
  }
}

export async function getModerationQueue(input: {
  bucketGoal: string;
  bucketExperience: string;
  weekStart: string;
}): Promise<ModerationQueue> {
  const supabase = await createClient();

  const [scoresResult, winsResult] = await Promise.all([
    supabase
      .from("leaderboard_entries")
      .select("user_id, display_label, habit_score, flag_reason, week_start")
      .eq("bucket_goal", input.bucketGoal)
      .eq("bucket_experience", input.bucketExperience)
      .eq("week_start", input.weekStart)
      .eq("score_flagged", true)
      .order("habit_score", { ascending: false })
      .limit(20),
    supabase
      .from("community_wins")
      .select("id, user_id, headline, occurred_at, hidden_at")
      .eq("bucket_goal", input.bucketGoal)
      .eq("bucket_experience", input.bucketExperience)
      .order("occurred_at", { ascending: false })
      .limit(15),
  ]);

  const winRows = winsResult.data ?? [];
  const userIds = [
    ...new Set([
      ...(scoresResult.data ?? []).map((row) => row.user_id as string),
      ...winRows.map((row) => row.user_id as string),
    ]),
  ];

  const labelByUserId = new Map<string, string>();
  for (const row of scoresResult.data ?? []) {
    labelByUserId.set(row.user_id as string, row.display_label as string);
  }

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, display_name, email")
      .in("id", userIds);

    for (const profile of profiles ?? []) {
      if (labelByUserId.has(profile.id as string)) continue;
      const first =
        (profile.first_name as string | null) ??
        (profile.display_name as string | null) ??
        profile.email?.toString().split("@")[0] ??
        "Forge athlete";
      labelByUserId.set(profile.id as string, first);
    }
  }

  return {
    flaggedScores: (scoresResult.data ?? []).map((row) => ({
      userId: row.user_id as string,
      displayLabel: row.display_label as string,
      habitScore: Number(row.habit_score),
      flagReason: (row.flag_reason as string | null) ?? null,
      weekStart: row.week_start as string,
    })),
    recentWins: winRows.map((row) => {
      const userId = row.user_id as string;
      return {
        id: row.id as string,
        userId,
        displayLabel: labelByUserId.get(userId) ?? "Forge athlete",
        headline: row.headline as string,
        occurredAt: row.occurred_at as string,
        hiddenAt: (row.hidden_at as string | null) ?? null,
      };
    }),
  };
}

export async function hideCommunityWin(input: {
  moderatorId: string;
  winId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: win, error: lookupError } = await supabase
    .from("community_wins")
    .select("id, user_id")
    .eq("id", input.winId)
    .maybeSingle();

  if (lookupError || !win) {
    return { ok: false, error: lookupError?.message ?? "Win not found." };
  }

  const { error } = await supabase
    .from("community_wins")
    .update({ hidden_at: now, hidden_by: input.moderatorId })
    .eq("id", input.winId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await writeModerationLog({
    moderatorId: input.moderatorId,
    action: "hide_win",
    targetUserId: win.user_id as string,
    targetWinId: input.winId,
  });

  return { ok: true };
}

export async function unhideCommunityWin(input: {
  moderatorId: string;
  winId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: win, error: lookupError } = await supabase
    .from("community_wins")
    .select("id, user_id")
    .eq("id", input.winId)
    .maybeSingle();

  if (lookupError || !win) {
    return { ok: false, error: lookupError?.message ?? "Win not found." };
  }

  const { error } = await supabase
    .from("community_wins")
    .update({ hidden_at: null, hidden_by: null })
    .eq("id", input.winId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await writeModerationLog({
    moderatorId: input.moderatorId,
    action: "unhide_win",
    targetUserId: win.user_id as string,
    targetWinId: input.winId,
  });

  return { ok: true };
}

export async function clearScoreFlag(input: {
  moderatorId: string;
  targetUserId: string;
  weekStart: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("leaderboard_entries")
    .update({ score_flagged: false, flag_reason: null })
    .eq("user_id", input.targetUserId)
    .eq("week_start", input.weekStart);

  if (error) {
    return { ok: false, error: error.message };
  }

  await writeModerationLog({
    moderatorId: input.moderatorId,
    action: "clear_score_flag",
    targetUserId: input.targetUserId,
    note: input.weekStart,
  });

  return { ok: true };
}

export async function setCommunitySuspended(input: {
  moderatorId: string;
  targetUserId: string;
  suspended: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      community_suspended: input.suspended,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.targetUserId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await writeModerationLog({
    moderatorId: input.moderatorId,
    action: input.suspended ? "suspend_user" : "unsuspend_user",
    targetUserId: input.targetUserId,
  });

  return { ok: true };
}
