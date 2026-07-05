"use server";

import { updateWeighInPushPreference } from "@/lib/coaching/progress-push";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getImpersonationMutationBlock } from "@/lib/auth/member-context";

export async function saveWeighInPushPreference(
  weeklyWeighInNudge: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const result = await updateWeighInPushPreference(user.id, weeklyWeighInNudge);
  if (!result.ok) {
    return result;
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/progress");
  return { ok: true };
}
