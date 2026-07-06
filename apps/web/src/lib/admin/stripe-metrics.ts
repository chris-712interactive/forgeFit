import type Stripe from "stripe";
import {
  getCompStripeExclusions,
  isCompStripeSubscription,
  type CompStripeExclusions,
} from "@/lib/admin/comp-exclusions";
import {
  getAllStripePriceIds,
  getStripe,
  hasStripeSecretKey,
  readSubscriptionItemPriceId,
  tierFromStripePriceId,
} from "@/lib/billing/stripe";
import type { PaidTier } from "@/lib/billing/types";

const CACHE_TTL_MS = 15 * 60 * 1000;

export interface StripeRevenueSnapshot {
  mrrUsd: number;
  arrUsd: number;
  proMrrUsd: number;
  proPlusMrrUsd: number;
  paidSubscribers: number;
  trialingCount: number;
  pastDueCount: number;
  proCount: number;
  proPlusCount: number;
  proMonthlyCount: number;
  proAnnualCount: number;
  proPlusMonthlyCount: number;
  proPlusAnnualCount: number;
  unknownPriceCount: number;
  excludedCompSubscriptions: number;
  fetchedAt: string;
  error?: string;
}

interface CacheEntry {
  expiresAt: number;
  snapshot: StripeRevenueSnapshot;
}

let revenueCache: CacheEntry | null = null;

const EMPTY_SNAPSHOT: Omit<StripeRevenueSnapshot, "fetchedAt"> = {
  mrrUsd: 0,
  arrUsd: 0,
  proMrrUsd: 0,
  proPlusMrrUsd: 0,
  paidSubscribers: 0,
  trialingCount: 0,
  pastDueCount: 0,
  proCount: 0,
  proPlusCount: 0,
  proMonthlyCount: 0,
  proAnnualCount: 0,
  proPlusMonthlyCount: 0,
  proPlusAnnualCount: 0,
  unknownPriceCount: 0,
  excludedCompSubscriptions: 0,
};

function tierIntervalFromPriceId(
  priceId: string
): { tier: PaidTier; interval: "monthly" | "annual" } | null {
  const all = getAllStripePriceIds();

  for (const tier of ["pro", "pro_plus"] as const) {
    const prices = all[tier];
    if (!prices) continue;
    if (priceId === prices.monthly) {
      return { tier, interval: "monthly" };
    }
    if (priceId === prices.annual) {
      return { tier, interval: "annual" };
    }
  }

  return null;
}

function recurringInterval(
  price: Stripe.Price | null | undefined
): Stripe.Price.Recurring.Interval | null {
  return price?.recurring?.interval ?? null;
}

function readSubscriptionCoupon(
  subscription: Stripe.Subscription
): Stripe.Coupon | null {
  const withLegacyDiscount = subscription as Stripe.Subscription & {
    discount?: { coupon?: Stripe.Coupon | string | null } | null;
  };
  const coupon = withLegacyDiscount.discount?.coupon;
  if (!coupon || typeof coupon === "string") {
    return null;
  }
  return coupon;
}

function subscriptionMrrUsd(subscription: Stripe.Subscription): number {
  const item = subscription.items.data[0];
  const price = typeof item?.price === "string" ? null : item?.price;
  const unitAmount = price?.unit_amount;
  if (unitAmount == null) return 0;

  let monthlyUsd = (unitAmount * (item?.quantity ?? 1)) / 100;

  const interval = recurringInterval(price);
  if (interval === "year") {
    monthlyUsd /= 12;
  } else if (interval === "week") {
    monthlyUsd = (monthlyUsd * 52) / 12;
  } else if (interval === "day") {
    monthlyUsd *= 30;
  }

  const coupon = readSubscriptionCoupon(subscription);
  if (coupon?.percent_off) {
    monthlyUsd *= (100 - coupon.percent_off) / 100;
  } else if (coupon?.amount_off) {
    const amountOffUsd = coupon.amount_off / 100;
    monthlyUsd = Math.max(
      0,
      monthlyUsd - (interval === "year" ? amountOffUsd / 12 : amountOffUsd)
    );
  }

  return monthlyUsd;
}

type StripeSubscriptionStatus = "active" | "trialing" | "past_due";

async function fetchSubscriptionsByStatus(
  stripe: Stripe,
  status: StripeSubscriptionStatus
): Promise<Stripe.Subscription[]> {
  const subscriptions: Stripe.Subscription[] = [];
  let startingAfter: string | undefined;

  while (true) {
    const page = await stripe.subscriptions.list({
      status,
      limit: 100,
      expand: ["data.items.data.price"],
      starting_after: startingAfter,
    });

    subscriptions.push(...page.data);

    if (!page.has_more || page.data.length === 0) {
      break;
    }

    startingAfter = page.data[page.data.length - 1]?.id;
  }

  return subscriptions;
}

function aggregateStripeSubscriptions(
  subscriptions: Stripe.Subscription[],
  compExclusions: CompStripeExclusions
): Omit<StripeRevenueSnapshot, "fetchedAt" | "error"> {
  let mrrUsd = 0;
  let proMrrUsd = 0;
  let proPlusMrrUsd = 0;
  let paidSubscribers = 0;
  let trialingCount = 0;
  let pastDueCount = 0;
  let proCount = 0;
  let proPlusCount = 0;
  let proMonthlyCount = 0;
  let proAnnualCount = 0;
  let proPlusMonthlyCount = 0;
  let proPlusAnnualCount = 0;
  let unknownPriceCount = 0;
  let excludedCompSubscriptions = 0;

  for (const subscription of subscriptions) {
    if (isCompStripeSubscription(subscription, compExclusions)) {
      excludedCompSubscriptions += 1;
      continue;
    }

    if (subscription.status === "past_due") {
      pastDueCount += 1;
    }

    if (subscription.status === "trialing") {
      trialingCount += 1;
    }

    const isPaying =
      subscription.status === "active" ||
      subscription.status === "trialing" ||
      subscription.status === "past_due";

    if (!isPaying) {
      continue;
    }

    const priceId = readSubscriptionItemPriceId(subscription);
    const mapped = priceId ? tierIntervalFromPriceId(priceId) : null;
    const tier = mapped?.tier ?? tierFromStripePriceId(priceId);

    if (!tier) {
      if (priceId) {
        unknownPriceCount += 1;
      }
      continue;
    }

    const subMrr = subscriptionMrrUsd(subscription);
    paidSubscribers += 1;
    mrrUsd += subMrr;

    if (tier === "pro") {
      proCount += 1;
      proMrrUsd += subMrr;
      if (mapped?.interval === "monthly") proMonthlyCount += 1;
      else if (mapped?.interval === "annual") proAnnualCount += 1;
    } else if (tier === "pro_plus") {
      proPlusCount += 1;
      proPlusMrrUsd += subMrr;
      if (mapped?.interval === "monthly") proPlusMonthlyCount += 1;
      else if (mapped?.interval === "annual") proPlusAnnualCount += 1;
    }
  }

  const roundedMrr = Math.round(mrrUsd * 100) / 100;

  return {
    mrrUsd: roundedMrr,
    arrUsd: Math.round(roundedMrr * 12 * 100) / 100,
    proMrrUsd: Math.round(proMrrUsd * 100) / 100,
    proPlusMrrUsd: Math.round(proPlusMrrUsd * 100) / 100,
    paidSubscribers,
    trialingCount,
    pastDueCount,
    proCount,
    proPlusCount,
    proMonthlyCount,
    proAnnualCount,
    proPlusMonthlyCount,
    proPlusAnnualCount,
    unknownPriceCount,
    excludedCompSubscriptions,
  };
}

/**
 * Returns Stripe subscription revenue snapshot. Requires STRIPE_SECRET_KEY only.
 * Never falls back to profile tiers — empty counts mean zero Stripe subs.
 */
export async function getStripeRevenueSnapshot(): Promise<StripeRevenueSnapshot | null> {
  if (!hasStripeSecretKey()) {
    return null;
  }

  const now = Date.now();
  if (revenueCache && revenueCache.expiresAt > now) {
    return revenueCache.snapshot;
  }

  try {
    const stripe = getStripe();
    const [active, trialing, pastDue, compExclusions] = await Promise.all([
      fetchSubscriptionsByStatus(stripe, "active"),
      fetchSubscriptionsByStatus(stripe, "trialing"),
      fetchSubscriptionsByStatus(stripe, "past_due"),
      getCompStripeExclusions(),
    ]);

    const seen = new Set<string>();
    const unique: Stripe.Subscription[] = [];
    for (const subscription of [...active, ...trialing, ...pastDue]) {
      if (seen.has(subscription.id)) continue;
      seen.add(subscription.id);
      unique.push(subscription);
    }

    const snapshot: StripeRevenueSnapshot = {
      ...aggregateStripeSubscriptions(unique, compExclusions),
      fetchedAt: new Date().toISOString(),
    };

    revenueCache = {
      expiresAt: now + CACHE_TTL_MS,
      snapshot,
    };

    return snapshot;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe API request failed.";

    return {
      ...EMPTY_SNAPSHOT,
      fetchedAt: new Date().toISOString(),
      error: message,
    };
  }
}

/** Clears cached Stripe metrics (for tests or after manual refresh). */
export function clearStripeRevenueCache(): void {
  revenueCache = null;
}
