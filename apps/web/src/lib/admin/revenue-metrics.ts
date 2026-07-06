import type Stripe from "stripe";
import {
  getCompStripeExclusions,
  isCompStripeSubscription,
} from "@/lib/admin/comp-exclusions";
import { listAdminAuditLog, type AdminAuditEntry } from "@/lib/admin/audit";
import { compArrEquivalentUsd } from "@/lib/admin/list-prices";
import {
  getStripeRevenueSnapshot,
  type StripeRevenueSnapshot,
} from "@/lib/admin/stripe-metrics";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getStripe,
  hasStripeSecretKey,
  readSubscriptionItemPriceId,
  tierFromStripePriceId,
  getAllStripePriceIds,
} from "@/lib/billing/stripe";
import type { PaidTier, SubscriptionTier } from "@/lib/billing/types";

const CACHE_TTL_MS = 15 * 60 * 1000;

export interface CompTierBreakdown {
  pro: number;
  proPlus: number;
  arrEquivalentUsd: number;
}

export interface RevenueTierRow {
  tier: "Pro" | "Pro+";
  monthly: number;
  annual: number;
  comp: number;
  mrrContributionUsd: number;
}

export interface NetRevenueWeekPoint {
  weekStart: string;
  netUsd: number;
}

export interface AdminRevenueMetrics {
  stripeConnected: boolean;
  stripeError: string | null;
  revenueFetchedAt: string | null;
  snapshot: StripeRevenueSnapshot | null;
  compBreakdown: CompTierBreakdown;
  tierRows: RevenueTierRow[];
  newPaid7d: number;
  newPaid30d: number;
  churned30d: number;
  churnRate30d: number | null;
  netRevenue30dUsd: number;
  netRevenueChart: NetRevenueWeekPoint[];
  billingEvents: AdminAuditEntry[];
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

let lifecycleCache: CacheEntry<{
  newPaid7d: number;
  newPaid30d: number;
  churned30d: number;
  churnRate30d: number | null;
}> | null = null;

let netRevenueCache: CacheEntry<{
  netRevenue30dUsd: number;
  netRevenueChart: NetRevenueWeekPoint[];
}> | null = null;

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

function isRecognizedPaidSubscription(
  subscription: Stripe.Subscription,
  compExclusions: Awaited<ReturnType<typeof getCompStripeExclusions>>
): boolean {
  if (isCompStripeSubscription(subscription, compExclusions)) {
    return false;
  }

  const isPaying =
    subscription.status === "active" ||
    subscription.status === "trialing" ||
    subscription.status === "past_due";

  if (!isPaying) return false;

  const priceId = readSubscriptionItemPriceId(subscription);
  const mapped = priceId ? tierIntervalFromPriceId(priceId) : null;
  const tier = mapped?.tier ?? tierFromStripePriceId(priceId);

  return Boolean(tier);
}

async function fetchAllSubscriptionsByStatus(
  stripe: Stripe,
  status: Stripe.Subscription.Status
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

async function getLifecycleMetrics(
  paidSubscribers: number
): Promise<{
  newPaid7d: number;
  newPaid30d: number;
  churned30d: number;
  churnRate30d: number | null;
}> {
  const now = Date.now();
  if (lifecycleCache && lifecycleCache.expiresAt > now) {
    return lifecycleCache.value;
  }

  if (!hasStripeSecretKey()) {
    return {
      newPaid7d: 0,
      newPaid30d: 0,
      churned30d: 0,
      churnRate30d: null,
    };
  }

  try {
    const stripe = getStripe();
    const compExclusions = await getCompStripeExclusions();
    const sevenDaysAgo = Math.floor(
      (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000
    );
    const thirtyDaysAgo = Math.floor(
      (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000
    );

    const [active, trialing, pastDue, canceled] = await Promise.all([
      fetchAllSubscriptionsByStatus(stripe, "active"),
      fetchAllSubscriptionsByStatus(stripe, "trialing"),
      fetchAllSubscriptionsByStatus(stripe, "past_due"),
      fetchAllSubscriptionsByStatus(stripe, "canceled"),
    ]);

    const payingRecent = [...active, ...trialing, ...pastDue].filter((sub) =>
      isRecognizedPaidSubscription(sub, compExclusions)
    );

    let newPaid7d = 0;
    let newPaid30d = 0;

    for (const subscription of payingRecent) {
      const created = subscription.created;
      if (created >= thirtyDaysAgo) {
        newPaid30d += 1;
        if (created >= sevenDaysAgo) {
          newPaid7d += 1;
        }
      }
    }

    let churned30d = 0;
    for (const subscription of canceled) {
      if (isCompStripeSubscription(subscription, compExclusions)) {
        continue;
      }

      const canceledAt = subscription.canceled_at;
      if (!canceledAt || canceledAt < thirtyDaysAgo) {
        continue;
      }

      const priceId = readSubscriptionItemPriceId(subscription);
      const tier =
        tierIntervalFromPriceId(priceId ?? "")?.tier ??
        tierFromStripePriceId(priceId);

      if (tier) {
        churned30d += 1;
      }
    }

    const denominator = paidSubscribers + churned30d;
    const churnRate30d =
      denominator > 0
        ? Math.round((churned30d / denominator) * 1000) / 10
        : null;

    const value = { newPaid7d, newPaid30d, churned30d, churnRate30d };
    lifecycleCache = { expiresAt: now + CACHE_TTL_MS, value };
    return value;
  } catch (error) {
    console.error("admin lifecycle metrics failed:", error);
    return {
      newPaid7d: 0,
      newPaid30d: 0,
      churned30d: 0,
      churnRate30d: null,
    };
  }
}

function startOfUtcWeek(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

function weekKey(date: Date): string {
  return startOfUtcWeek(date).toISOString().slice(0, 10);
}

async function getNetRevenueMetrics(): Promise<{
  netRevenue30dUsd: number;
  netRevenueChart: NetRevenueWeekPoint[];
}> {
  const now = Date.now();
  if (netRevenueCache && netRevenueCache.expiresAt > now) {
    return netRevenueCache.value;
  }

  if (!hasStripeSecretKey()) {
    return { netRevenue30dUsd: 0, netRevenueChart: [] };
  }

  try {
    const stripe = getStripe();
    const ninetyDaysAgo = Math.floor(
      (Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000
    );
    const thirtyDaysAgo = Math.floor(
      (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000
    );

    const transactions: Stripe.BalanceTransaction[] = [];
    let startingAfter: string | undefined;

    while (true) {
      const page = await stripe.balanceTransactions.list({
        limit: 100,
        created: { gte: ninetyDaysAgo },
        starting_after: startingAfter,
      });

      transactions.push(...page.data);

      if (!page.has_more || page.data.length === 0) {
        break;
      }

      startingAfter = page.data[page.data.length - 1]?.id;
    }

    let netRevenue30dUsd = 0;
    const weeklyTotals = new Map<string, number>();

    for (const tx of transactions) {
      const netUsd = tx.net / 100;
      if (tx.created >= thirtyDaysAgo) {
        netRevenue30dUsd += netUsd;
      }

      const key = weekKey(new Date(tx.created * 1000));
      weeklyTotals.set(key, (weeklyTotals.get(key) ?? 0) + netUsd);
    }

    const netRevenueChart = [...weeklyTotals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekStart, netUsd]) => ({
        weekStart,
        netUsd: Math.round(netUsd * 100) / 100,
      }));

    const value = {
      netRevenue30dUsd: Math.round(netRevenue30dUsd * 100) / 100,
      netRevenueChart,
    };

    netRevenueCache = { expiresAt: now + CACHE_TTL_MS, value };
    return value;
  } catch (error) {
    console.error("admin net revenue metrics failed:", error);
    return { netRevenue30dUsd: 0, netRevenueChart: [] };
  }
}

async function getCompTierBreakdown(): Promise<CompTierBreakdown> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("subscription_tier, subscription_status, billing_source")
    .eq("billing_source", "comp");

  if (error) {
    console.error("comp tier breakdown failed:", error.message);
    return { pro: 0, proPlus: 0, arrEquivalentUsd: 0 };
  }

  let pro = 0;
  let proPlus = 0;
  let arrEquivalentUsd = 0;

  for (const row of data ?? []) {
    const tier = row.subscription_tier as SubscriptionTier;
    const status = row.subscription_status as string;

    if (status !== "active" && status !== "trialing") {
      continue;
    }

    if (tier === "pro") {
      pro += 1;
      arrEquivalentUsd += compArrEquivalentUsd("pro");
    } else if (tier === "pro_plus") {
      proPlus += 1;
      arrEquivalentUsd += compArrEquivalentUsd("pro_plus");
    }
  }

  return {
    pro,
    proPlus,
    arrEquivalentUsd: Math.round(arrEquivalentUsd * 100) / 100,
  };
}

function buildTierRows(
  snapshot: StripeRevenueSnapshot | null,
  compBreakdown: CompTierBreakdown
): RevenueTierRow[] {
  const proMrr = snapshot?.proMrrUsd ?? 0;
  const proPlusMrr = snapshot?.proPlusMrrUsd ?? 0;

  return [
    {
      tier: "Pro",
      monthly: snapshot?.proMonthlyCount ?? 0,
      annual: snapshot?.proAnnualCount ?? 0,
      comp: compBreakdown.pro,
      mrrContributionUsd: proMrr,
    },
    {
      tier: "Pro+",
      monthly: snapshot?.proPlusMonthlyCount ?? 0,
      annual: snapshot?.proPlusAnnualCount ?? 0,
      comp: compBreakdown.proPlus,
      mrrContributionUsd: proPlusMrr,
    },
  ];
}

async function getBillingEvents(): Promise<AdminAuditEntry[]> {
  const entries = await listAdminAuditLog(100);
  return entries.filter((entry) =>
    ["comp.grant", "comp.revoke"].includes(entry.action)
  ).slice(0, 12);
}

export async function getAdminRevenueMetrics(): Promise<AdminRevenueMetrics> {
  const [snapshot, compBreakdown, billingEvents] = await Promise.all([
    getStripeRevenueSnapshot(),
    getCompTierBreakdown(),
    getBillingEvents(),
  ]);

  const paidSubscribers = snapshot?.paidSubscribers ?? 0;

  const [lifecycle, netRevenue] = await Promise.all([
    getLifecycleMetrics(paidSubscribers),
    getNetRevenueMetrics(),
  ]);

  return {
    stripeConnected: Boolean(snapshot && !snapshot.error),
    stripeError: snapshot?.error ?? null,
    revenueFetchedAt: snapshot?.fetchedAt ?? null,
    snapshot,
    compBreakdown,
    tierRows: buildTierRows(snapshot, compBreakdown),
    newPaid7d: lifecycle.newPaid7d,
    newPaid30d: lifecycle.newPaid30d,
    churned30d: lifecycle.churned30d,
    churnRate30d: lifecycle.churnRate30d,
    netRevenue30dUsd: netRevenue.netRevenue30dUsd,
    netRevenueChart: netRevenue.netRevenueChart,
    billingEvents,
  };
}

/** Clears extended revenue caches (e.g. after comp grant). */
export function clearAdminRevenueCache(): void {
  lifecycleCache = null;
  netRevenueCache = null;
}
