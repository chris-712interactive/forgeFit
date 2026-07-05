"use server";

import {
  updatePushPreferences,
  type CommunityPushPreferences,
} from "@/lib/coaching/community-push";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getImpersonationMutationBlock } from "@/lib/auth/member-context";

async function requireCommunityUser() {
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
    return { ok: false as const, error: "Join community to manage push settings." };
  }

  return { ok: true as const, userId: user.id };
}

export async function saveCommunityPushPreferences(
  preferences: Partial<CommunityPushPreferences>
): Promise<{ ok: boolean; error?: string }> {
  const auth = await requireCommunityUser();
  if (!auth.ok) {
    return auth;
  }

  const result = await updatePushPreferences(auth.userId, preferences);
  if (!result.ok) {
    return result;
  }

  revalidatePath("/profile");
  return { ok: true };
}
