import type { SupabaseClient } from "@supabase/supabase-js";

export type PostAuthPath = "/home" | "/onboarding" | "/disclaimer";

export async function getPostAuthPath(
  supabase: SupabaseClient,
  userId: string
): Promise<PostAuthPath> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("onboarding_complete, health_disclaimer_accepted_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    return "/onboarding";
  }

  if (!profile.onboarding_complete) {
    return "/onboarding";
  }

  if (!profile.health_disclaimer_accepted_at) {
    return "/disclaimer";
  }

  return "/home";
}
