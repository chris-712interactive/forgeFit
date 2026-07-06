import { writeAdminAuditLog } from "@/lib/admin/audit";
import {
  applyStripeSubscriptionCoupon,
  getStripeSubscriptionDiscount,
  listStripeCoupons,
  removeStripeSubscriptionDiscount,
  type StripeCouponOption,
  type StripeSubscriptionDiscount,
} from "@/lib/admin/stripe-discount";
import { syncSubscriptionToProfile } from "@/lib/billing/sync-subscription";
import { getStripe, retrieveSubscriptionForSync } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const MIN_DISCOUNT_REASON_LENGTH = 10;

export interface AdminUserDiscountContext {
  canManageDiscount: boolean;
  stripeSubscriptionId: string | null;
  currentDiscount: StripeSubscriptionDiscount | null;
  coupons: StripeCouponOption[];
}

function validateDiscountReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length < MIN_DISCOUNT_REASON_LENGTH) {
    return `Reason must be at least ${MIN_DISCOUNT_REASON_LENGTH} characters.`;
  }
  return null;
}

export async function getAdminUserDiscountContext(
  userId: string
): Promise<AdminUserDiscountContext> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select(
      "stripe_subscription_id, billing_source, subscription_status"
    )
    .eq("id", userId)
    .maybeSingle();

  const stripeSubscriptionId =
    (profile?.stripe_subscription_id as string | null) ?? null;
  const billingSource = profile?.billing_source as string | null;
  const status = profile?.subscription_status as string | null;

  const canManageDiscount = Boolean(
    stripeSubscriptionId &&
      billingSource !== "comp" &&
      (status === "active" || status === "past_due")
  );

  const [currentDiscount, coupons] = await Promise.all([
    stripeSubscriptionId && canManageDiscount
      ? getStripeSubscriptionDiscount(stripeSubscriptionId)
      : Promise.resolve(null),
    listStripeCoupons(),
  ]);

  return {
    canManageDiscount,
    stripeSubscriptionId,
    currentDiscount,
    coupons,
  };
}

export async function applyAdminUserDiscount(input: {
  adminUserId: string;
  targetUserId: string;
  couponId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const reasonError = validateDiscountReason(input.reason);
  if (reasonError) {
    return { ok: false, error: reasonError };
  }

  const context = await getAdminUserDiscountContext(input.targetUserId);
  if (!context.canManageDiscount || !context.stripeSubscriptionId) {
    return {
      ok: false,
      error: "User does not have an eligible Stripe subscription.",
    };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", input.targetUserId)
    .maybeSingle();

  const result = await applyStripeSubscriptionCoupon({
    subscriptionId: context.stripeSubscriptionId,
    couponId: input.couponId.trim(),
  });

  if (!result.ok) {
    return result;
  }

  try {
    const stripe = getStripe();
    const subscription = await retrieveSubscriptionForSync(
      stripe,
      context.stripeSubscriptionId
    );
    await syncSubscriptionToProfile(subscription, { stripe });
  } catch (error) {
    console.error("discount apply profile resync failed:", error);
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: "discount.apply",
    targetUserId: input.targetUserId,
    payload: {
      couponId: input.couponId.trim(),
      reason: input.reason.trim(),
      targetEmail: profile?.email ?? null,
    },
  });

  return { ok: true };
}

export async function removeAdminUserDiscount(input: {
  adminUserId: string;
  targetUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const reasonError = validateDiscountReason(input.reason);
  if (reasonError) {
    return { ok: false, error: reasonError };
  }

  const context = await getAdminUserDiscountContext(input.targetUserId);
  if (!context.canManageDiscount || !context.stripeSubscriptionId) {
    return {
      ok: false,
      error: "User does not have an eligible Stripe subscription.",
    };
  }

  if (!context.currentDiscount) {
    return { ok: false, error: "No active discount on this subscription." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", input.targetUserId)
    .maybeSingle();

  const result = await removeStripeSubscriptionDiscount(
    context.stripeSubscriptionId
  );

  if (!result.ok) {
    return result;
  }

  try {
    const stripe = getStripe();
    const subscription = await retrieveSubscriptionForSync(
      stripe,
      context.stripeSubscriptionId
    );
    await syncSubscriptionToProfile(subscription, { stripe });
  } catch (error) {
    console.error("discount remove profile resync failed:", error);
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: "discount.remove",
    targetUserId: input.targetUserId,
    payload: {
      previousCouponId: context.currentDiscount.couponId,
      reason: input.reason.trim(),
      targetEmail: profile?.email ?? null,
    },
  });

  return { ok: true };
}
