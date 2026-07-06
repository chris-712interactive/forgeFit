import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import type { CommunityMetricsSnapshot } from "@/lib/coaching/community-metrics";
import { getCommunityMetrics } from "@/lib/coaching/community-metrics";
import { getWeekBounds } from "@/lib/home/weekly-stats";

export type AdminFlaggedScoreRow = {
  id: string;
  userId: string;
  displayLabel: string;
  bucketGoal: string;
  bucketExperience: string;
  weekStart: string;
  habitScore: number;
  flagReason: string | null;
};

export type AdminModerationWinRow = {
  id: string;
  userId: string;
  displayLabel: string;
  bucketGoal: string;
  bucketExperience: string;
  winType: string;
  headline: string;
  detail: string | null;
  occurredAt: string;
  hiddenAt: string | null;
};

export type AdminCommunityModerationData = {
  communityMetrics: CommunityMetricsSnapshot | null;
  flaggedScores: AdminFlaggedScoreRow[];
  wins: AdminModerationWinRow[];
};

async function writeModerationLog(
  admin: ReturnType<typeof createAdminClient>,
  entry: {
    moderatorId: string;
    action: string;
    targetUserId?: string | null;
    targetWinId?: string | null;
    note?: string | null;
  },
): Promise<void> {
  const { error } = await admin.from("community_moderation_log").insert({
    moderator_id: entry.moderatorId,
    action: entry.action,
    target_user_id: entry.targetUserId ?? null,
    target_win_id: entry.targetWinId ?? null,
    note: entry.note ?? null,
  });

  if (error) {
    console.error("community moderation log insert failed:", error.message);
  }
}

function memberDisplayLabel(profile: {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
}): string {
  if (profile.display_name?.trim()) return profile.display_name.trim();
  const first = profile.first_name?.trim();
  const last = profile.last_name?.trim();
  if (first && last) return `${first} ${last.charAt(0)}.`;
  if (first) return first;
  if (profile.email) return profile.email.split("@")[0] ?? "Member";
  return "Member";
}

export async function getAdminCommunityModerationData(): Promise<AdminCommunityModerationData> {
  const admin = createAdminClient();
  const { start } = getWeekBounds();

  const [communityMetrics, flaggedResult, winsResult] = await Promise.all([
    getCommunityMetrics(),
    admin
      .from("leaderboard_entries")
      .select(
        "id, user_id, display_label, bucket_goal, bucket_experience, week_start, habit_score, flag_reason",
      )
      .eq("score_flagged", true)
      .order("week_start", { ascending: false })
      .order("habit_score", { ascending: false })
      .limit(100),
    admin
      .from("community_wins")
      .select(
        "id, user_id, bucket_goal, bucket_experience, win_type, headline, detail, occurred_at, hidden_at, profiles!inner(first_name, last_name, email, display_name)",
      )
      .gte("occurred_at", start.toISOString())
      .order("occurred_at", { ascending: false })
      .limit(80),
  ]);

  const flaggedScores: AdminFlaggedScoreRow[] = (flaggedResult.data ?? []).map(
    (row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      displayLabel: row.display_label as string,
      bucketGoal: row.bucket_goal as string,
      bucketExperience: row.bucket_experience as string,
      weekStart: row.week_start as string,
      habitScore: Number(row.habit_score),
      flagReason: (row.flag_reason as string | null) ?? null,
    }),
  );

  const wins: AdminModerationWinRow[] = (winsResult.data ?? []).map((row) => {
    const rawProfile = row.profiles as
      | {
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          display_name: string | null;
        }
      | {
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          display_name: string | null;
        }[]
      | null;
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

    return {
      id: row.id as string,
      userId: row.user_id as string,
      displayLabel: memberDisplayLabel(
        profile ?? {
          first_name: null,
          last_name: null,
          email: null,
          display_name: null,
        },
      ),
      bucketGoal: row.bucket_goal as string,
      bucketExperience: row.bucket_experience as string,
      winType: row.win_type as string,
      headline: row.headline as string,
      detail: (row.detail as string | null) ?? null,
      occurredAt: row.occurred_at as string,
      hiddenAt: (row.hidden_at as string | null) ?? null,
    };
  });

  return { communityMetrics, flaggedScores, wins };
}

export async function adminClearScoreFlag(input: {
  adminUserId: string;
  scoreId: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { data: score } = await admin
    .from("leaderboard_entries")
    .select("user_id, week_start, bucket_goal, bucket_experience")
    .eq("id", input.scoreId)
    .maybeSingle();

  if (!score) throw new Error("Score not found.");

  const { error } = await admin
    .from("leaderboard_entries")
    .update({ score_flagged: false, flag_reason: null })
    .eq("id", input.scoreId);

  if (error) throw new Error(error.message);

  await Promise.all([
    writeModerationLog(admin, {
      moderatorId: input.adminUserId,
      action: "clear_score_flag",
      targetUserId: score.user_id as string,
      note: score.week_start as string,
    }),
    writeAdminAuditLog({
      adminUserId: input.adminUserId,
      action: "community.clear_score_flag",
      targetUserId: score.user_id as string,
      payload: {
        score_id: input.scoreId,
        week_start: score.week_start,
        bucket_goal: score.bucket_goal,
        bucket_experience: score.bucket_experience,
      },
    }),
  ]);
}

export async function adminHideCommunityWin(input: {
  adminUserId: string;
  winId: string;
  reason?: string;
}): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: win } = await admin
    .from("community_wins")
    .select("user_id")
    .eq("id", input.winId)
    .maybeSingle();

  if (!win) throw new Error("Win not found.");

  const { error } = await admin
    .from("community_wins")
    .update({
      hidden_at: now,
      hidden_by: input.adminUserId,
    })
    .eq("id", input.winId);

  if (error) throw new Error(error.message);

  await Promise.all([
    writeModerationLog(admin, {
      moderatorId: input.adminUserId,
      action: "hide_win",
      targetUserId: win.user_id as string,
      targetWinId: input.winId,
      note: input.reason?.trim() || null,
    }),
    writeAdminAuditLog({
      adminUserId: input.adminUserId,
      action: "community.hide_win",
      targetUserId: win.user_id as string,
      payload: { win_id: input.winId, reason: input.reason?.trim() || null },
    }),
  ]);
}

export async function adminUnhideCommunityWin(input: {
  adminUserId: string;
  winId: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { data: win } = await admin
    .from("community_wins")
    .select("user_id")
    .eq("id", input.winId)
    .maybeSingle();

  if (!win) throw new Error("Win not found.");

  const { error } = await admin
    .from("community_wins")
    .update({ hidden_at: null, hidden_by: null })
    .eq("id", input.winId);

  if (error) throw new Error(error.message);

  await Promise.all([
    writeModerationLog(admin, {
      moderatorId: input.adminUserId,
      action: "unhide_win",
      targetUserId: win.user_id as string,
      targetWinId: input.winId,
    }),
    writeAdminAuditLog({
      adminUserId: input.adminUserId,
      action: "community.unhide_win",
      targetUserId: win.user_id as string,
      payload: { win_id: input.winId },
    }),
  ]);
}

export async function adminSuspendCommunityUser(input: {
  adminUserId: string;
  userId: string;
  reason?: string;
}): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({
      community_suspended: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId);

  if (error) throw new Error(error.message);

  await Promise.all([
    writeModerationLog(admin, {
      moderatorId: input.adminUserId,
      action: "suspend_user",
      targetUserId: input.userId,
      note: input.reason?.trim() || null,
    }),
    writeAdminAuditLog({
      adminUserId: input.adminUserId,
      action: "community.suspend_user",
      targetUserId: input.userId,
      payload: { reason: input.reason?.trim() || null },
    }),
  ]);
}

export async function adminUnsuspendCommunityUser(input: {
  adminUserId: string;
  userId: string;
}): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({
      community_suspended: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId);

  if (error) throw new Error(error.message);

  await Promise.all([
    writeModerationLog(admin, {
      moderatorId: input.adminUserId,
      action: "unsuspend_user",
      targetUserId: input.userId,
    }),
    writeAdminAuditLog({
      adminUserId: input.adminUserId,
      action: "community.unsuspend_user",
      targetUserId: input.userId,
    }),
  ]);
}
