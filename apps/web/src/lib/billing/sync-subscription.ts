import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";
import { tierFromStripePriceId } from "./stripe";
import type { SubscriptionStatus, SubscriptionTier } from "./types";

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "inactive";
  }
}

function tierFromSubscription(subscription: Stripe.Subscription): SubscriptionTier {
  const status = mapStripeStatus(subscription.status);
  if (status !== "active" && status !== "trialing") {
    return "free";
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const paidTier = tierFromStripePriceId(priceId);

  if (paidTier) {
    return paidTier;
  }

  // Metadata fallback when price IDs are not yet wired (e.g. local dev)
  const metadataTier = subscription.metadata.tier;
  if (metadataTier === "pro_plus" || metadataTier === "pro") {
    return metadataTier;
  }

  return "free";
}

function readPeriodEnd(subscription: Stripe.Subscription): string | null {
  const raw = subscription as Stripe.Subscription & {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  const unix =
    raw.current_period_end ?? raw.items?.data?.[0]?.current_period_end;

  return typeof unix === "number"
    ? new Date(unix * 1000).toISOString()
    : null;
}

export async function syncSubscriptionToProfile(
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata.user_id;
  if (!userId) {
    throw new Error("Stripe subscription missing metadata.user_id");
  }

  const status = mapStripeStatus(subscription.status);
  const tier = tierFromSubscription(subscription);
  const currentPeriodEnd = readPeriodEnd(subscription);

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      subscription_tier: tier,
      subscription_status: status,
      stripe_subscription_id: subscription.id,
      stripe_customer_id:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      subscription_current_period_end: currentPeriodEnd,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function clearSubscriptionForUser(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      subscription_tier: "free",
      subscription_status: "canceled",
      stripe_subscription_id: null,
      subscription_current_period_end: null,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
