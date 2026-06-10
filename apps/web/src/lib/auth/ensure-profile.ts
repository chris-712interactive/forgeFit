import type { SupabaseClient, User } from "@supabase/supabase-js";

/** Create a profiles row for OAuth/email users if the auth trigger has not run yet. */
export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User
): Promise<void> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return;

  await supabase.from("profiles").insert({
    id: user.id,
    email: user.email ?? null,
  });
}
