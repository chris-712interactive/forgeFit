import { createAdminClient } from "@/lib/supabase/admin";
import {
  communityWeekStartIso,
  previousCommunityWeekStartIso,
  weekStartBefore,
} from "./community-week";

export type CommunityActionType =
  | "score_upsert"
  | "cheer"
  | "follow"
  | "reaction"
  | "comment"
  | "opt_in";

export const WACP_ACTION_TYPES: CommunityActionType[] = [
  "score_upsert",
  "cheer",
  "follow",
  "reaction",
];

export interface CommunityMetricsSnapshot {
  weekStart: string;
  priorWeekStart: string;
  wacp: number;
  wacpPriorWeek: number;
  proEligible: number;
  optedIn: number;
  optInRate: number;
  firstActionWithin7d: number;
  actionMix: Record<CommunityActionType, number>;
  variantBreakdown: {
    control: { eligible: number; optedIn: number };
    default_on_ui: { eligible: number; optedIn: number };
  };
  flaggedScores: number;
  weeklyRecapEmailsSent: number;
}

function tryAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

function isMetricsTableMissing(error: { message?: string; code?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("community_action_events") ||
    message.includes("community_email_sends") ||
    message.includes("schema cache")
  );
}

export async function recordCommunityAction(
  userId: string,
  actionType: CommunityActionType
): Promise<void> {
  const admin = tryAdminClient();
  if (!admin) {
    return;
  }

  const weekStart = communityWeekStartIso();
  const { error } = await admin.from("community_action_events").insert({
    user_id: userId,
    action_type: actionType,
    week_start: weekStart,
  });

  if (error && !isMetricsTableMissing(error)) {
    console.error("community action event insert failed:", error.message);
  }
}

async function countDistinctWacpUsers(
  admin: ReturnType<typeof createAdminClient>,
  weekStart: string
): Promise<number> {
  const { data, error } = await admin
    .from("community_action_events")
    .select("user_id")
    .eq("week_start", weekStart)
    .in("action_type", WACP_ACTION_TYPES);

  if (error || !data) {
    return 0;
  }

  const userIds = new Set(data.map((row) => row.user_id as string));
  if (userIds.size === 0) {
    return 0;
  }

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, subscription_tier, subscription_status, gamification_opt_in")
    .in("id", [...userIds]);

  return (profiles ?? []).filter(
    (profile) =>
      profile.gamification_opt_in === true &&
      (profile.subscription_tier === "pro" ||
        profile.subscription_tier === "pro_plus") &&
      (profile.subscription_status === "active" ||
        profile.subscription_status === "trialing")
  ).length;
}

async function countActionMix(
  admin: ReturnType<typeof createAdminClient>,
  weekStart: string
): Promise<Record<CommunityActionType, number>> {
  const mix: Record<CommunityActionType, number> = {
    score_upsert: 0,
    cheer: 0,
    follow: 0,
    reaction: 0,
    comment: 0,
    opt_in: 0,
  };

  const { data, error } = await admin
    .from("community_action_events")
    .select("action_type")
    .eq("week_start", weekStart);

  if (error || !data) {
    return mix;
  }

  for (const row of data) {
    const key = row.action_type as CommunityActionType;
    if (key in mix) {
      mix[key] += 1;
    }
  }

  return mix;
}

export async function getCommunityMetrics(
  reference = new Date()
): Promise<CommunityMetricsSnapshot | null> {
  const admin = tryAdminClient();
  if (!admin) {
    return null;
  }

  const weekStart = communityWeekStartIso(reference);
  const priorWeekStart = previousCommunityWeekStartIso(reference);

  const { data: proProfiles, error: profilesError } = await admin
    .from("profiles")
    .select(
      "id, gamification_opt_in, community_opt_in_variant, subscription_tier, subscription_status"
    )
    .in("subscription_tier", ["pro", "pro_plus"])
    .in("subscription_status", ["active", "trialing"]);

  if (profilesError) {
    console.error("community metrics profile query failed:", profilesError.message);
    return null;
  }

  const eligible = proProfiles ?? [];
  const optedInProfiles = eligible.filter((profile) => profile.gamification_opt_in);
  const optedIn = optedInProfiles.length;
  const proEligible = eligible.length;
  const optInRate = proEligible > 0 ? Math.round((optedIn / proEligible) * 100) : 0;

  const variantBreakdown = {
    control: { eligible: 0, optedIn: 0 },
    default_on_ui: { eligible: 0, optedIn: 0 },
  };

  for (const profile of eligible) {
    const variant =
      profile.community_opt_in_variant === "default_on_ui"
        ? "default_on_ui"
        : "control";
    variantBreakdown[variant].eligible += 1;
    if (profile.gamification_opt_in) {
      variantBreakdown[variant].optedIn += 1;
    }
  }

  const sevenDaysAgo = new Date(reference);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  const { data: recentOptIns } = await admin
    .from("community_action_events")
    .select("user_id")
    .eq("action_type", "opt_in")
    .gte("created_at", sevenDaysAgoIso);

  const recentOptInUserIds = new Set(
    (recentOptIns ?? []).map((row) => row.user_id as string)
  );

  let firstActionWithin7d = 0;
  if (recentOptInUserIds.size > 0) {
    const { data: followUpActions } = await admin
      .from("community_action_events")
      .select("user_id")
      .in("user_id", [...recentOptInUserIds])
      .in("action_type", WACP_ACTION_TYPES)
      .gte("created_at", sevenDaysAgoIso);

    firstActionWithin7d = new Set(
      (followUpActions ?? []).map((row) => row.user_id as string)
    ).size;
  }

  const [wacp, wacpPriorWeek, actionMix] = await Promise.all([
    countDistinctWacpUsers(admin, weekStart),
    countDistinctWacpUsers(admin, priorWeekStart),
    countActionMix(admin, weekStart),
  ]);

  const { count: flaggedScores } = await admin
    .from("leaderboard_entries")
    .select("user_id", { count: "exact", head: true })
    .eq("week_start", weekStart)
    .eq("score_flagged", true);

  const { count: weeklyRecapEmailsSent } = await admin
    .from("community_email_sends")
    .select("id", { count: "exact", head: true })
    .eq("week_start", priorWeekStart)
    .eq("kind", "weekly_recap");

  return {
    weekStart,
    priorWeekStart,
    wacp,
    wacpPriorWeek,
    proEligible,
    optedIn,
    optInRate,
    firstActionWithin7d,
    actionMix,
    variantBreakdown,
    flaggedScores: flaggedScores ?? 0,
    weeklyRecapEmailsSent: weeklyRecapEmailsSent ?? 0,
  };
}

export function wacpDelta(current: number, prior: number): number {
  return current - prior;
}

export { weekStartBefore };
