/**
 * Member-facing copy when a backend table/feature isn't ready.
 * Never expose migration names, SQL, or Supabase internals to users.
 */
export const FEATURE_TEMPORARILY_UNAVAILABLE =
  "This feature isn’t available on your account yet. Try again later — if it keeps happening, contact support.";

export const FEATURE_SAVE_TEMPORARILY_UNAVAILABLE =
  "We couldn’t save that just now. Try again in a moment — if it keeps happening, contact support.";

export const FEATURE_SYNC_TEMPORARILY_LIMITED =
  "Syncing is temporarily limited on your account. Your progress is still saved on this device.";

/** Map known schema/migration errors to safe member copy. */
export function memberFacingSchemaError(
  technicalMessage: string | null | undefined,
  fallback: string = FEATURE_TEMPORARILY_UNAVAILABLE
): string {
  if (!technicalMessage) return fallback;
  const lower = technicalMessage.toLowerCase();
  if (
    lower.includes("migration") ||
    lower.includes("supabase") ||
    lower.includes("schema cache") ||
    lower.includes("does not exist") ||
    lower.includes("pgrst") ||
    /\d{14}_/.test(technicalMessage)
  ) {
    return fallback;
  }
  return technicalMessage;
}
