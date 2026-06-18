"use server";

import { revalidatePath } from "next/cache";
import { recordCommunityWin as persistCommunityWin } from "@/lib/coaching/service";
import { createClient } from "@/lib/supabase/server";

export async function setGamificationOptIn(optIn: boolean): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      gamification_opt_in: optIn,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  return { ok: true };
}

export async function toggleCommunityWinCheer(winId: string): Promise<{
  ok: boolean;
  cheered?: boolean;
  cheerCount?: number;
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
    return { ok: false, error: "Join community to cheer wins." };
  }

  const { data: existing } = await supabase
    .from("community_win_cheers")
    .select("id")
    .eq("win_id", winId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("community_win_cheers")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return { ok: false, error: error.message };
    }
  } else {
    const { error } = await supabase.from("community_win_cheers").insert({
      win_id: winId,
      user_id: user.id,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  const { count } = await supabase
    .from("community_win_cheers")
    .select("id", { count: "exact", head: true })
    .eq("win_id", winId);

  revalidatePath("/home");
  return {
    ok: true,
    cheered: !existing,
    cheerCount: count ?? 0,
  };
}

export async function publishWorkoutPrWin(input: {
  headline: string;
  detail: string;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await persistCommunityWin({
    userId: user.id,
    winType: "pr",
    headline: input.headline,
    detail: input.detail,
  });

  revalidatePath("/home");
}
