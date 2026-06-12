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
