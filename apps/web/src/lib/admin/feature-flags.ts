import { writeAdminAuditLog } from "@/lib/admin/audit";
import {
  KNOWN_ADMIN_FEATURE_FLAGS,
  type AdminFeatureFlagKey,
} from "@/lib/admin/feature-flags-constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type { AdminFeatureFlagKey } from "@/lib/admin/feature-flags-constants";
export { KNOWN_ADMIN_FEATURE_FLAGS } from "@/lib/admin/feature-flags-constants";

const MIN_REASON_LENGTH = 10;

function validateReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length < MIN_REASON_LENGTH) {
    return `Reason must be at least ${MIN_REASON_LENGTH} characters.`;
  }
  return null;
}

function sanitizeFlags(
  input: Record<string, boolean> | null | undefined
): Record<string, boolean> {
  const raw = input ?? {};
  const allowed = new Set<string>(
    KNOWN_ADMIN_FEATURE_FLAGS.map((flag) => flag.key)
  );
  const result: Record<string, boolean> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (allowed.has(key) && value === true) {
      result[key] = true;
    }
  }

  return result;
}

/** Parse profiles.admin_feature_flags for subscription snapshot / runtime gates. */
export function parseAdminFeatureFlags(
  input: Record<string, boolean> | null | undefined
): Record<AdminFeatureFlagKey, boolean> {
  const sanitized = sanitizeFlags(input);
  return sanitized as Record<AdminFeatureFlagKey, boolean>;
}

export async function getUserAdminFeatureFlags(
  userId: string
): Promise<Record<string, boolean>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("admin_feature_flags")
    .eq("id", userId)
    .maybeSingle();

  const raw = (data?.admin_feature_flags as Record<string, boolean> | null) ?? {};
  return parseAdminFeatureFlags(raw);
}

/** Runtime gate — user can read own flags via RLS on profiles. */
export async function userHasAdminFeatureFlag(
  userId: string,
  flag: AdminFeatureFlagKey
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("admin_feature_flags")
    .eq("id", userId)
    .maybeSingle();

  const flags = (data?.admin_feature_flags as Record<string, boolean> | null) ?? {};
  return flags[flag] === true;
}

export async function setUserAdminFeatureFlags(input: {
  adminUserId: string;
  targetUserId: string;
  flags: Record<string, boolean>;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const reasonError = validateReason(input.reason);
  if (reasonError) {
    return { ok: false, error: reasonError };
  }

  const admin = createAdminClient();
  const sanitized = sanitizeFlags(input.flags);

  const { data: existing, error: fetchError } = await admin
    .from("profiles")
    .select("email")
    .eq("id", input.targetUserId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, error: "User not found." };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ admin_feature_flags: sanitized })
    .eq("id", input.targetUserId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: "feature_flags.update",
    targetUserId: input.targetUserId,
    payload: {
      flags: sanitized,
      reason: input.reason.trim(),
      targetEmail: existing.email,
    },
  });

  return { ok: true };
}
