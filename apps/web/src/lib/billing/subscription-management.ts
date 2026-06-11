import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type Stripe from "stripe";
import {
  getAllStripePriceIds,
  getStripe,
  getStripePriceIds,
  readSubscriptionItemPriceId,
  retrieveSubscriptionForSync,
  tierFromStripePriceId,
} from "./stripe";
import { syncSubscriptionToProfile } from "./sync-subscription";
import type { BillingInterval } from "./pricing";
import type { PlanChangePreview } from "./plan-change-preview";
import { isPlanUpgrade, recurringLabelFor } from "./plan-change-preview";
import type { PaidTier } from "./types";

export interface UserBillingRecord {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export async function getUserBillingRecord(
  userId: string
): Promise<UserBillingRecord | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, stripe_customer_id, stripe_subscription_id")
    .eq("id", userId)
    .single();

  if (!data) return null;

  return {
    userId: data.id,
    stripeCustomerId: data.stripe_customer_id ?? null,
    stripeSubscriptionId: data.stripe_subscription_id ?? null,
  };
}

export function detectBillingInterval(
  priceId: string | undefined
): BillingInterval | null {
  if (!priceId) return null;

  const all = getAllStripePriceIds();
  if (!all.pro || !all.pro_plus) return null;

  if (priceId === all.pro.annual || priceId === all.pro_plus.annual) {
    return "annual";
  }
  if (priceId === all.pro.monthly || priceId === all.pro_plus.monthly) {
    return "monthly";
  }

  return null;
}

interface PlanChangeContext {
  stripe: ReturnType<typeof getStripe>;
  subscription: Stripe.Subscription;
  itemId: string;
  newPriceId: string;
  targetInterval: BillingInterval;
  currentTier: PaidTier | null;
  targetTier: PaidTier;
  customerId: string;
}

async function resolvePlanChangeContext(
  userId: string,
  tier: PaidTier,
  interval?: BillingInterval
): Promise<PlanChangeContext> {
  const billing = await getUserBillingRecord(userId);
  if (!billing?.stripeSubscriptionId || !billing.stripeCustomerId) {
    throw new Error("No active subscription to change.");
  }

  const stripe = getStripe();
  const subscription = await retrieveSubscriptionForSync(
    stripe,
    billing.stripeSubscriptionId
  );

  if (subscription.status !== "active" && subscription.status !== "trialing") {
    throw new Error("Subscription is not active.");
  }

  const currentPriceId = readSubscriptionItemPriceId(subscription);
  const currentInterval =
    detectBillingInterval(currentPriceId) ?? interval ?? "monthly";
  const targetInterval = interval ?? currentInterval;
  const priceIds = getStripePriceIds(tier);
  const newPriceId =
    targetInterval === "annual" ? priceIds.annual : priceIds.monthly;

  const itemId = subscription.items.data[0]?.id;
  if (!itemId) {
    throw new Error("Subscription has no items.");
  }

  return {
    stripe,
    subscription,
    itemId,
    newPriceId,
    targetInterval,
    currentTier: currentTierFromPriceId(currentPriceId),
    targetTier: tier,
    customerId: billing.stripeCustomerId,
  };
}

function formatPeriodEndLabel(
  subscription: Stripe.Subscription
): string | null {
  const unix = (
    subscription as Stripe.Subscription & { current_period_end?: number }
  ).current_period_end;

  if (typeof unix !== "number") return null;

  return new Date(unix * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function previewSubscriptionPlanChange(
  userId: string,
  tier: PaidTier,
  interval?: BillingInterval
): Promise<PlanChangePreview> {
  const ctx = await resolvePlanChangeContext(userId, tier, interval);

  const preview = await ctx.stripe.invoices.createPreview({
    customer: ctx.customerId,
    subscription: ctx.subscription.id,
    subscription_details: {
      items: [{ id: ctx.itemId, price: ctx.newPriceId }],
      proration_behavior: "create_prorations",
    },
  });

  const lineSummaries =
    preview.lines?.data
      .map((line) => line.description)
      .filter((value): value is string => Boolean(value)) ?? [];

  return {
    currentTier: ctx.currentTier,
    targetTier: ctx.targetTier,
    interval: ctx.targetInterval,
    currency: preview.currency ?? "usd",
    dueTodayCents: preview.amount_due ?? 0,
    currentRecurringLabel: ctx.currentTier
      ? recurringLabelFor(ctx.currentTier, ctx.targetInterval)
      : "Free",
    newRecurringLabel: recurringLabelFor(ctx.targetTier, ctx.targetInterval),
    isUpgrade: isPlanUpgrade(ctx.currentTier, ctx.targetTier),
    periodEndLabel: formatPeriodEndLabel(ctx.subscription),
    lineSummaries,
  };
}

export async function changeSubscriptionPlan(
  userId: string,
  tier: PaidTier,
  interval?: BillingInterval
) {
  const ctx = await resolvePlanChangeContext(userId, tier, interval);

  const updated = await ctx.stripe.subscriptions.update(ctx.subscription.id, {
    items: [{ id: ctx.itemId, price: ctx.newPriceId }],
    metadata: {
      ...ctx.subscription.metadata,
      user_id: userId,
      tier,
    },
    cancel_at_period_end: false,
    proration_behavior: "create_prorations",
  });

  const expanded = await retrieveSubscriptionForSync(ctx.stripe, updated.id);
  await syncSubscriptionToProfile(expanded, { stripe: ctx.stripe });

  return {
    tier,
    interval: ctx.targetInterval,
    status: expanded.status,
  };
}

export async function cancelSubscription(
  userId: string,
  options?: { immediate?: boolean }
) {
  const billing = await getUserBillingRecord(userId);
  if (!billing?.stripeSubscriptionId) {
    throw new Error("No active subscription to cancel.");
  }

  const stripe = getStripe();

  if (options?.immediate) {
    const canceled = await stripe.subscriptions.cancel(
      billing.stripeSubscriptionId
    );
    await syncSubscriptionToProfile(canceled, { stripe });
    return { canceled: true as const, immediate: true as const };
  }

  const updated = await stripe.subscriptions.update(
    billing.stripeSubscriptionId,
    { cancel_at_period_end: true }
  );

  const expanded = await retrieveSubscriptionForSync(stripe, updated.id);
  await syncSubscriptionToProfile(expanded, { stripe });

  const periodEndUnix = (
    expanded as Stripe.Subscription & { current_period_end?: number }
  ).current_period_end;

  return {
    canceled: true as const,
    immediate: false as const,
    cancelAtPeriodEnd: expanded.cancel_at_period_end,
    currentPeriodEnd: periodEndUnix,
  };
}

export async function resumeSubscription(userId: string) {
  const billing = await getUserBillingRecord(userId);
  if (!billing?.stripeSubscriptionId) {
    throw new Error("No subscription to resume.");
  }

  const stripe = getStripe();
  const updated = await stripe.subscriptions.update(
    billing.stripeSubscriptionId,
    { cancel_at_period_end: false }
  );

  const expanded = await retrieveSubscriptionForSync(stripe, updated.id);
  await syncSubscriptionToProfile(expanded, { stripe });

  return { resumed: true as const };
}

export async function createBillingPortalSession(
  userId: string,
  returnUrl: string
) {
  const billing = await getUserBillingRecord(userId);
  if (!billing?.stripeCustomerId) {
    throw new Error("No Stripe customer on file.");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: returnUrl,
  });

  if (!session.url) {
    throw new Error("Unable to open billing portal.");
  }

  return session.url;
}

export async function userHasActiveStripeSubscription(
  userId: string
): Promise<boolean> {
  const billing = await getUserBillingRecord(userId);
  if (!billing?.stripeSubscriptionId) return false;

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(
    billing.stripeSubscriptionId
  );

  return subscription.status === "active" || subscription.status === "trialing";
}

/** After cancel + no active sub, ensure profile is free. */
export async function reconcileFreeTierIfNeeded(userId: string) {
  const hasActive = await userHasActiveStripeSubscription(userId);
  if (hasActive) return;

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      subscription_tier: "free",
      subscription_status: "canceled",
      subscription_cancel_at_period_end: false,
      stripe_subscription_id: null,
      subscription_current_period_end: null,
    })
    .eq("id", userId);
}

export function currentTierFromPriceId(priceId: string | undefined): PaidTier | null {
  return tierFromStripePriceId(priceId);
}
