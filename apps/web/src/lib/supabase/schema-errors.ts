import {
  FEATURE_SAVE_TEMPORARILY_UNAVAILABLE,
  memberFacingSchemaError,
} from "@/lib/ui/member-errors";

/** Map PostgREST / Supabase schema-cache errors to safe member copy. */
export function friendlySupabaseError(message: string): string {
  console.error("Supabase schema error:", message);
  return memberFacingSchemaError(message, FEATURE_SAVE_TEMPORARILY_UNAVAILABLE);
}
