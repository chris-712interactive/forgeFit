import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";
import {
  getStripe,
  mergeSubscriptionMetadata,
  readSubscriptionItemPriceId,
  resolveSubscriptionUserId,
  retrieveSubscriptionForSync,
  tierFromStripePriceId,
} from "./stripe";
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

  const priceId = readSubscriptionItemPriceId(subscription);
  const paidTier = tierFromStripePriceId(priceId);

  if (paidTier) {
    return paidTier;
  }

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

export interface SyncSubscriptionOptions {
  stripe?: Stripe;
  sessionMetadata?: Record<string, string | undefined>;
}

export async function syncSubscriptionToProfile(
  subscription: Stripe.Subscription,
  options?: SyncSubscriptionOptions
) {
  if (
    subscription.status === "incomplete" ||
    subscription.status === "incomplete_expired"
  ) {
    return;
  }

  const stripe = options?.stripe ?? getStripe();
  const merged = mergeSubscriptionMetadata(subscription, options?.sessionMetadata);
  const userId =
    merged.metadata.user_id ??
    (await resolveSubscriptionUserId(merged, stripe));

  if (!userId) {
    throw new Error(
      "Could not resolve user_id from subscription or customer metadata."
    );
  }

  const status = mapStripeStatus(merged.status);
  const tier = tierFromSubscription(merged);
  const currentPeriodEnd = readPeriodEnd(merged);

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      subscription_tier: tier,
      subscription_status: status,
      stripe_subscription_id: merged.id,
      stripe_customer_id:
        typeof merged.customer === "string"
          ? merged.customer
          : merged.customer.id,
      subscription_current_period_end: currentPeriodEnd,
      subscription_cancel_at_period_end: Boolean(merged.cancel_at_period_end),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncCheckoutSessionToProfile(
  session: Stripe.Checkout.Session,
  stripe: Stripe
) {
  if (session.mode !== "subscription") return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!subscriptionId) return;

  const subscription = await retrieveSubscriptionForSync(stripe, subscriptionId);
  await syncSubscriptionToProfile(subscription, {
    stripe,
    sessionMetadata: {
      user_id: session.metadata?.user_id,
      tier: session.metadata?.tier,
    },
  });
}

export async function syncLatestSubscriptionForCustomer(
  customerId: string,
  stripe: Stripe
) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });

  const candidate =
    subscriptions.data.find((sub) => sub.status === "active") ??
    subscriptions.data.find((sub) => sub.status === "trialing");

  if (!candidate) {
    return { synced: false as const, reason: "no_active_subscription" };
  }

  const subscription = await retrieveSubscriptionForSync(stripe, candidate.id);
  await syncSubscriptionToProfile(subscription, { stripe });

  return {
    synced: true as const,
    tier: tierFromSubscription(subscription),
    status: mapStripeStatus(subscription.status),
  };
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
      subscription_cancel_at_period_end: false,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
