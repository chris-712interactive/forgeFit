import type Stripe from "stripe";
import {
  getAllStripePriceIds,
  getStripe,
  isStripeConfigured,
  readSubscriptionItemPriceId,
  tierFromStripePriceId,
} from "@/lib/billing/stripe";
import type { PaidTier } from "@/lib/billing/types";

const CACHE_TTL_MS = 15 * 60 * 1000;

export interface StripeRevenueSnapshot {
  mrrUsd: number;
  arrUsd: number;
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
  fetchedAt: string;
}

interface CacheEntry {
  expiresAt: number;
  snapshot: StripeRevenueSnapshot;
}

let revenueCache: CacheEntry | null = null;

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

  let monthlyUsd = ((unitAmount * (item?.quantity ?? 1)) / 100);

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
  subscriptions: Stripe.Subscription[]
): Omit<StripeRevenueSnapshot, "fetchedAt"> {
  let mrrUsd = 0;
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

  for (const subscription of subscriptions) {
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

    paidSubscribers += 1;
    mrrUsd += subscriptionMrrUsd(subscription);

    const priceId = readSubscriptionItemPriceId(subscription);
    const mapped = priceId ? tierIntervalFromPriceId(priceId) : null;
    const tier = mapped?.tier ?? tierFromStripePriceId(priceId);

    if (tier === "pro") {
      proCount += 1;
      if (mapped?.interval === "monthly") proMonthlyCount += 1;
      else if (mapped?.interval === "annual") proAnnualCount += 1;
    } else if (tier === "pro_plus") {
      proPlusCount += 1;
      if (mapped?.interval === "monthly") proPlusMonthlyCount += 1;
      else if (mapped?.interval === "annual") proPlusAnnualCount += 1;
    } else if (priceId) {
      unknownPriceCount += 1;
    }
  }

  const roundedMrr = Math.round(mrrUsd * 100) / 100;

  return {
    mrrUsd: roundedMrr,
    arrUsd: Math.round(roundedMrr * 12 * 100) / 100,
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
  };
}

export async function getStripeRevenueSnapshot(): Promise<StripeRevenueSnapshot | null> {
  if (!isStripeConfigured()) {
    return null;
  }

  const now = Date.now();
  if (revenueCache && revenueCache.expiresAt > now) {
    return revenueCache.snapshot;
  }

  const stripe = getStripe();
  const [active, trialing, pastDue] = await Promise.all([
    fetchSubscriptionsByStatus(stripe, "active"),
    fetchSubscriptionsByStatus(stripe, "trialing"),
    fetchSubscriptionsByStatus(stripe, "past_due"),
  ]);

  const seen = new Set<string>();
  const unique: Stripe.Subscription[] = [];
  for (const subscription of [...active, ...trialing, ...pastDue]) {
    if (seen.has(subscription.id)) continue;
    seen.add(subscription.id);
    unique.push(subscription);
  }

  const snapshot: StripeRevenueSnapshot = {
    ...aggregateStripeSubscriptions(unique),
    fetchedAt: new Date().toISOString(),
  };

  revenueCache = {
    expiresAt: now + CACHE_TTL_MS,
    snapshot,
  };

  return snapshot;
}

/** Clears cached Stripe metrics (for tests or after manual refresh). */
export function clearStripeRevenueCache(): void {
  revenueCache = null;
}
