import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, retrieveSubscriptionForSync } from "@/lib/billing/stripe";
import { syncSubscriptionToProfile } from "@/lib/billing/sync-subscription";
import type { PaidTier } from "@/lib/billing/types";
import { writeAdminAuditLog } from "./audit";
import { clearStripeRevenueCache } from "./stripe-metrics";
import { clearAdminRevenueCache } from "./revenue-metrics";

const MIN_COMP_REASON_LENGTH = 10;

export interface GrantCompInput {
  adminUserId: string;
  targetUserId: string;
  tier: PaidTier;
  expiresAt: string;
  reason: string;
}

export interface RevokeCompInput {
  adminUserId: string;
  targetUserId: string;
  reason: string;
}

function validateCompReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length < MIN_COMP_REASON_LENGTH) {
    return `Reason must be at least ${MIN_COMP_REASON_LENGTH} characters.`;
  }
  return null;
}

export async function grantCompUpgrade(
  input: GrantCompInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const reasonError = validateCompReason(input.reason);
  if (reasonError) {
    return { ok: false, error: reasonError };
  }

  const expiresAt = new Date(input.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return { ok: false, error: "Invalid expiry date." };
  }
  if (expiresAt.getTime() <= Date.now()) {
    return { ok: false, error: "Expiry must be in the future." };
  }

  const admin = createAdminClient();
  const { data: existing, error: fetchError } = await admin
    .from("profiles")
    .select("id, email")
    .eq("id", input.targetUserId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, error: "User not found." };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      subscription_tier: input.tier,
      subscription_status: "active",
      billing_source: "comp",
      comp_reason: input.reason.trim(),
      comp_expires_at: expiresAt.toISOString(),
      subscription_cancel_at_period_end: false,
    })
    .eq("id", input.targetUserId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: "comp.grant",
    targetUserId: input.targetUserId,
    payload: {
      tier: input.tier,
      expiresAt: expiresAt.toISOString(),
      reason: input.reason.trim(),
      targetEmail: existing.email,
    },
  });

  clearStripeRevenueCache();
  clearAdminRevenueCache();

  return { ok: true };
}

export async function revokeCompAccess(
  input: RevokeCompInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const reasonError = validateCompReason(input.reason);
  if (reasonError) {
    return { ok: false, error: reasonError };
  }

  const admin = createAdminClient();
  const { data: existing, error: fetchError } = await admin
    .from("profiles")
    .select("id, email, billing_source, stripe_subscription_id")
    .eq("id", input.targetUserId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, error: "User not found." };
  }

  if (existing.billing_source !== "comp") {
    return { ok: false, error: "User does not have an active comp grant." };
  }

  const hasStripeSub = Boolean(existing.stripe_subscription_id);
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      subscription_tier: "free",
      subscription_status: hasStripeSub ? "active" : "inactive",
      billing_source: hasStripeSub ? "stripe" : null,
      comp_reason: null,
      comp_expires_at: null,
    })
    .eq("id", input.targetUserId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  if (existing.stripe_subscription_id) {
    try {
      const stripe = getStripe();
      const subscription = await retrieveSubscriptionForSync(
        stripe,
        existing.stripe_subscription_id as string
      );
      await syncSubscriptionToProfile(subscription, { stripe });
    } catch (error) {
      console.error("comp revoke stripe resync failed:", error);
    }
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: "comp.revoke",
    targetUserId: input.targetUserId,
    payload: {
      reason: input.reason.trim(),
      targetEmail: existing.email,
      restoredStripe: hasStripeSub,
    },
  });

  clearStripeRevenueCache();
  clearAdminRevenueCache();

  return { ok: true };
}

export async function expireCompIfNeeded(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select(
      "billing_source, comp_expires_at, stripe_subscription_id, subscription_tier, subscription_status"
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.billing_source !== "comp" || !profile.comp_expires_at) {
    return;
  }

  if (new Date(profile.comp_expires_at).getTime() > Date.now()) {
    return;
  }

  const hasStripeSub = Boolean(profile.stripe_subscription_id);
  await admin
    .from("profiles")
    .update({
      subscription_tier: "free",
      subscription_status: hasStripeSub ? "active" : "inactive",
      billing_source: hasStripeSub ? "stripe" : null,
      comp_reason: null,
      comp_expires_at: null,
    })
    .eq("id", userId);
}
