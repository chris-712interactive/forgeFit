/** Map PostgREST / Supabase schema-cache errors to actionable copy. */
export function friendlySupabaseError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("fat_loss_pace") ||
    lower.includes("recomp_priority") ||
    lower.includes("goal_weight_kg") ||
    lower.includes("signup_source")
  ) {
    return (
      "Your database is missing profile columns (body composition targets or signup source). " +
      "Apply pending migrations from supabase/migrations/ " +
      "(especially 20260611100000_body_composition_targets.sql and 20260630100000_signup_source.sql) " +
      "via Supabase SQL Editor or run `supabase db push`, then try again."
    );
  }

  if (lower.includes("schema cache")) {
    return (
      `${message} — If you recently added features, apply pending migrations from supabase/migrations/ ` +
      "(see docs/supabase-setup.md), then retry."
    );
  }

  return message;
}
