import { writeAdminAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelSubscription } from "@/lib/billing/subscription-management";
import { getStripe, retrieveSubscriptionForSync } from "@/lib/billing/stripe";
import { syncSubscriptionToProfile } from "@/lib/billing/sync-subscription";
import type Stripe from "stripe";

const MIN_REASON_LENGTH = 10;

function readInvoicePaymentIntentId(invoice: Stripe.Invoice): string | null {
  const withLegacy = invoice as Stripe.Invoice & {
    payment_intent?: string | Stripe.PaymentIntent | null;
    charge?: string | Stripe.Charge | null;
  };

  const paymentIntent = withLegacy.payment_intent;
  if (typeof paymentIntent === "string") return paymentIntent;
  if (paymentIntent?.id) return paymentIntent.id;

  const charge = withLegacy.charge;
  if (typeof charge === "string") return null;
  if (charge?.payment_intent) {
    return typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent.id;
  }

  return null;
}

function validateReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length < MIN_REASON_LENGTH) {
    return `Reason must be at least ${MIN_REASON_LENGTH} characters.`;
  }
  return null;
}

export interface AdminBillingContext {
  canManageBilling: boolean;
  stripeSubscriptionId: string | null;
  billingSource: string | null;
}

export async function getAdminBillingContext(
  userId: string
): Promise<AdminBillingContext> {
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
  const billingSource = (profile?.billing_source as string | null) ?? null;
  const status = profile?.subscription_status as string | null;

  const canManageBilling = Boolean(
    stripeSubscriptionId &&
      billingSource !== "comp" &&
      (status === "active" || status === "past_due" || status === "trialing")
  );

  return {
    canManageBilling,
    stripeSubscriptionId,
    billingSource,
  };
}

export async function adminCancelUserSubscription(input: {
  adminUserId: string;
  targetUserId: string;
  immediate: boolean;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const reasonError = validateReason(input.reason);
  if (reasonError) {
    return { ok: false, error: reasonError };
  }

  const context = await getAdminBillingContext(input.targetUserId);
  if (!context.canManageBilling) {
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

  try {
    await cancelSubscription(input.targetUserId, {
      immediate: input.immediate,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not cancel subscription.";
    return { ok: false, error: message };
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: input.immediate ? "billing.cancel_immediate" : "billing.cancel_period_end",
    targetUserId: input.targetUserId,
    payload: {
      reason: input.reason.trim(),
      targetEmail: profile?.email ?? null,
    },
  });

  return { ok: true };
}

export async function adminRefundLatestSubscriptionPayment(input: {
  adminUserId: string;
  targetUserId: string;
  reason: string;
}): Promise<{ ok: true; refundId: string } | { ok: false; error: string }> {
  const reasonError = validateReason(input.reason);
  if (reasonError) {
    return { ok: false, error: reasonError };
  }

  const context = await getAdminBillingContext(input.targetUserId);
  if (!context.stripeSubscriptionId) {
    return { ok: false, error: "No Stripe subscription on file." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", input.targetUserId)
    .maybeSingle();

  try {
    const stripe = getStripe();
    const invoices = await stripe.invoices.list({
      subscription: context.stripeSubscriptionId,
      status: "paid",
      limit: 1,
    });

    const invoice = invoices.data[0];
    if (!invoice) {
      return { ok: false, error: "No paid invoice found for this subscription." };
    }

    const fullInvoice = await stripe.invoices.retrieve(invoice.id, {
      expand: ["payments.data.payment.payment_intent"],
    });

    const paymentIntentId = readInvoicePaymentIntentId(fullInvoice);

    if (!paymentIntentId) {
      return { ok: false, error: "Latest invoice has no payment to refund." };
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });

    const subscription = await retrieveSubscriptionForSync(
      stripe,
      context.stripeSubscriptionId
    );
    await syncSubscriptionToProfile(subscription, { stripe });

    await writeAdminAuditLog({
      adminUserId: input.adminUserId,
      action: "billing.refund",
      targetUserId: input.targetUserId,
      payload: {
        reason: input.reason.trim(),
        targetEmail: profile?.email ?? null,
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount,
      },
    });

    return { ok: true, refundId: refund.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not issue refund.";
    return { ok: false, error: message };
  }
}
