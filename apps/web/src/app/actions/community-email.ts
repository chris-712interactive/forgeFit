"use server";

import { saveCommunityEmailPreferences } from "@/lib/coaching/community-email";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getImpersonationMutationBlock } from "@/lib/auth/member-context";

export async function setCommunityWeeklyRecapEmail(enabled: boolean): Promise<{
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("gamification_opt_in")
    .eq("id", user.id)
    .single();

  if (!profile?.gamification_opt_in) {
    return { ok: false, error: "Join community to manage email preferences." };
  }

  const result = await saveCommunityEmailPreferences({
    userId: user.id,
    weeklyRecap: enabled,
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath("/profile");
  return { ok: true };
}
