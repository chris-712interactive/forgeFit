"use server";

import {
  createCommunityCrew,
  joinCommunityCrewByCode,
  leaveCommunityCrew,
} from "@/lib/coaching/community-crews";
import {
  markAllCommunityNotificationsRead,
  toggleCommunityFollow,
} from "@/lib/coaching/community-social";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  clearScoreFlag,
  hideCommunityWin,
  isCommunityModerator,
  setCommunitySuspended,
  unhideCommunityWin,
} from "@/lib/coaching/community-moderation";

async function requireCommunityMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Sign in required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("gamification_opt_in")
    .eq("id", user.id)
    .single();

  if (!profile?.gamification_opt_in) {
    return { ok: false as const, error: "Join community to use crews." };
  }

  return { ok: true as const, userId: user.id };
}

function revalidateCommunity() {
  revalidatePath("/community");
  revalidatePath("/home");
  revalidatePath("/", "layout");
}

export async function createCrew(name: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const auth = await requireCommunityMember();
  if (!auth.ok) {
    return auth;
  }

  const result = await createCommunityCrew(auth.userId, name);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidateCommunity();
  return { ok: true };
}

export async function joinCrewByCode(code: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const auth = await requireCommunityMember();
  if (!auth.ok) {
    return auth;
  }

  const result = await joinCommunityCrewByCode(auth.userId, code);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidateCommunity();
  return { ok: true };
}

export async function leaveCrew(): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireCommunityMember();
  if (!auth.ok) {
    return auth;
  }

  const result = await leaveCommunityCrew(auth.userId);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidateCommunity();
  return { ok: true };
}

export async function toggleFollowPeer(followeeId: string): Promise<{
  ok: boolean;
  following?: boolean;
  isMutual?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("gamification_opt_in")
    .eq("id", user.id)
    .single();

  if (!profile?.gamification_opt_in) {
    return { ok: false, error: "Join community to follow peers." };
  }

  const result = await toggleCommunityFollow(user.id, followeeId);
  if (result.error) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/community");
  revalidatePath("/home");
  return {
    ok: true,
    following: result.following,
    isMutual: result.isMutual,
  };
}

export async function markNotificationRead(notificationId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const id = notificationId?.trim();
  if (!id) {
    return { ok: false, error: "Invalid notification." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { data, error } = await supabase
    .from("community_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("read_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "Notification not found or already read." };
  }

  revalidatePath("/community");
  revalidatePath("/home");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false };
  }

  await markAllCommunityNotificationsRead(user.id);
  revalidatePath("/community");
  revalidatePath("/home");
  revalidatePath("/", "layout");
  return { ok: true };
}

async function requireCommunityModerator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Sign in required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_community_moderator, gamification_opt_in")
    .eq("id", user.id)
    .single();

  if (!profile?.gamification_opt_in) {
    return { ok: false as const, error: "Join community to moderate." };
  }

  if (
    !isCommunityModerator({
      userId: user.id,
      profileFlag: profile.is_community_moderator,
    })
  ) {
    return { ok: false as const, error: "Moderator access required." };
  }

  return { ok: true as const, userId: user.id };
}

export async function moderateHideWin(winId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const auth = await requireCommunityModerator();
  if (!auth.ok) {
    return auth;
  }

  const result = await hideCommunityWin({
    moderatorId: auth.userId,
    winId,
  });

  if (!result.ok) {
    return result;
  }

  revalidateCommunity();
  return { ok: true };
}

export async function moderateUnhideWin(winId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const auth = await requireCommunityModerator();
  if (!auth.ok) {
    return auth;
  }

  const result = await unhideCommunityWin({
    moderatorId: auth.userId,
    winId,
  });

  if (!result.ok) {
    return result;
  }

  revalidateCommunity();
  return { ok: true };
}

export async function moderateClearScoreFlag(input: {
  targetUserId: string;
  weekStart: string;
}): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireCommunityModerator();
  if (!auth.ok) {
    return auth;
  }

  const result = await clearScoreFlag({
    moderatorId: auth.userId,
    targetUserId: input.targetUserId,
    weekStart: input.weekStart,
  });

  if (!result.ok) {
    return result;
  }

  revalidateCommunity();
  return { ok: true };
}

export async function moderateSetSuspended(input: {
  targetUserId: string;
  suspended: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireCommunityModerator();
  if (!auth.ok) {
    return auth;
  }

  const result = await setCommunitySuspended({
    moderatorId: auth.userId,
    targetUserId: input.targetUserId,
    suspended: input.suspended,
  });

  if (!result.ok) {
    return result;
  }

  revalidateCommunity();
  return { ok: true };
}
