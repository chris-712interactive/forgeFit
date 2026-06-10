import type { SupabaseClient } from "@supabase/supabase-js";

export async function getPostAuthPath(
  supabase: SupabaseClient,
  userId: string
): Promise<"/home" | "/onboarding"> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return "/onboarding";
  }

  return profile.onboarding_complete ? "/home" : "/onboarding";
}
