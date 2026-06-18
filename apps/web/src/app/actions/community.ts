"use server";

import {
  markAllCommunityNotificationsRead,
  toggleCommunityFollow,
} from "@/lib/coaching/community-social";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
