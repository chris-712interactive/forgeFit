import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionTier } from "@/lib/billing/types";
import { getStripeRevenueSnapshot } from "@/lib/admin/stripe-metrics";

export interface AdminOverviewMetrics {
  totalUsers: number;
  signupsLast30Days: number;
  compCount: number;
  /** Users with paid tier in DB but no Stripe sub (excludes comps). */
  profilePaidWithoutStripe: number;
  stripeConnected: boolean;
  stripeError: string | null;
  paidSubscribers: number;
  proCount: number;
  proPlusCount: number;
  proMonthlyCount: number;
  proAnnualCount: number;
  proPlusMonthlyCount: number;
  proPlusAnnualCount: number;
  trialingCount: number;
  pastDueCount: number;
  unknownPriceCount: number;
  mrrUsd: number;
  arrUsd: number;
  revenueSource: "stripe" | "unavailable";
  revenueFetchedAt: string | null;
}

function isPaidActive(tier: SubscriptionTier, status: string): boolean {
  return (
    (tier === "pro" || tier === "pro_plus") &&
    (status === "active" || status === "trialing")
  );
}

function countProfileAccess(rows: Array<Record<string, unknown>>): {
  compCount: number;
  profilePaidWithoutStripe: number;
} {
  let compCount = 0;
  let profilePaidWithoutStripe = 0;

  for (const row of rows) {
    const tier = row.subscription_tier as SubscriptionTier;
    const status = row.subscription_status as string;
    const billingSource = row.billing_source as string | null;
    const stripeSubscriptionId = row.stripe_subscription_id as string | null;

    if (billingSource === "comp" && isPaidActive(tier, status)) {
      compCount += 1;
      continue;
    }

    if (
      isPaidActive(tier, status) &&
      !stripeSubscriptionId &&
      billingSource !== "comp"
    ) {
      profilePaidWithoutStripe += 1;
    }
  }

  return { compCount, profilePaidWithoutStripe };
}

async function getProfileCounts(): Promise<{
  totalUsers: number;
  signupsLast30Days: number;
  compCount: number;
  profilePaidWithoutStripe: number;
}> {
  const admin = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString();

  const [profilesResult, recentResult] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "subscription_tier, subscription_status, billing_source, stripe_subscription_id, created_at"
      ),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", cutoff),
  ]);

  const rows = (profilesResult.data ?? []) as Array<Record<string, unknown>>;
  const { compCount, profilePaidWithoutStripe } = countProfileAccess(rows);

  return {
    totalUsers: rows.length,
    signupsLast30Days: recentResult.count ?? 0,
    compCount,
    profilePaidWithoutStripe,
  };
}

const ZERO_REVENUE = {
  paidSubscribers: 0,
  proCount: 0,
  proPlusCount: 0,
  proMonthlyCount: 0,
  proAnnualCount: 0,
  proPlusMonthlyCount: 0,
  proPlusAnnualCount: 0,
  trialingCount: 0,
  pastDueCount: 0,
  unknownPriceCount: 0,
  mrrUsd: 0,
  arrUsd: 0,
} as const;

export async function getAdminOverviewMetrics(): Promise<AdminOverviewMetrics> {
  const [profileCounts, stripeSnapshot] = await Promise.all([
    getProfileCounts(),
    getStripeRevenueSnapshot(),
  ]);

  const base = {
    totalUsers: profileCounts.totalUsers,
    signupsLast30Days: profileCounts.signupsLast30Days,
    compCount: profileCounts.compCount,
    profilePaidWithoutStripe: profileCounts.profilePaidWithoutStripe,
  };

  if (stripeSnapshot) {
    return {
      ...base,
      stripeConnected: !stripeSnapshot.error,
      stripeError: stripeSnapshot.error ?? null,
      paidSubscribers: stripeSnapshot.paidSubscribers,
      proCount: stripeSnapshot.proCount,
      proPlusCount: stripeSnapshot.proPlusCount,
      proMonthlyCount: stripeSnapshot.proMonthlyCount,
      proAnnualCount: stripeSnapshot.proAnnualCount,
      proPlusMonthlyCount: stripeSnapshot.proPlusMonthlyCount,
      proPlusAnnualCount: stripeSnapshot.proPlusAnnualCount,
      trialingCount: stripeSnapshot.trialingCount,
      pastDueCount: stripeSnapshot.pastDueCount,
      unknownPriceCount: stripeSnapshot.unknownPriceCount,
      mrrUsd: stripeSnapshot.mrrUsd,
      arrUsd: stripeSnapshot.arrUsd,
      revenueSource: "stripe",
      revenueFetchedAt: stripeSnapshot.fetchedAt,
    };
  }

  return {
    ...base,
    ...ZERO_REVENUE,
    stripeConnected: false,
    stripeError: null,
    revenueSource: "unavailable",
    revenueFetchedAt: null,
  };
}
