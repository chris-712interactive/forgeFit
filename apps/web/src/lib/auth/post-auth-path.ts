import type { SupabaseClient } from "@supabase/supabase-js";

export async function getPostAuthPath(
  supabase: SupabaseClient,
  userId: string
): Promise<"/home" | "/onboarding"> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", userId)
    .single();

  return profile?.onboarding_complete ? "/home" : "/onboarding";
}
