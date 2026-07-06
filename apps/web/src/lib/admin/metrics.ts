import { createAdminClient } from "@/lib/supabase/admin";
import { PRO_PLUS_PRICING, PRO_PRICING } from "@/lib/billing/pricing";
import type { SubscriptionTier } from "@/lib/billing/types";
import { getStripeRevenueSnapshot } from "@/lib/admin/stripe-metrics";

export interface AdminOverviewMetrics {
  totalUsers: number;
  signupsLast30Days: number;
  compCount: number;
  stripeConnected: boolean;
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
  revenueSource: "stripe" | "profile_estimate";
  revenueFetchedAt: string | null;
}

function isPaidActive(tier: SubscriptionTier, status: string): boolean {
  return (
    (tier === "pro" || tier === "pro_plus") &&
    (status === "active" || status === "trialing")
  );
}

function profileBasedEstimate(rows: Array<Record<string, unknown>>): Omit<
  AdminOverviewMetrics,
  "totalUsers" | "signupsLast30Days" | "compCount" | "stripeConnected" | "revenueSource" | "revenueFetchedAt"
> {
  let proCount = 0;
  let proPlusCount = 0;
  let pastDueCount = 0;
  let mrrUsd = 0;

  for (const row of rows) {
    const tier = row.subscription_tier as SubscriptionTier;
    const status = row.subscription_status as string;
    const billingSource = row.billing_source as string | null;

    if (status === "past_due") {
      pastDueCount += 1;
    }

    if (billingSource === "comp") {
      continue;
    }

    if (!isPaidActive(tier, status)) {
      continue;
    }

    if (tier === "pro") {
      proCount += 1;
      mrrUsd += PRO_PRICING.monthly.amountUsd;
    } else if (tier === "pro_plus") {
      proPlusCount += 1;
      mrrUsd += PRO_PLUS_PRICING.monthly.amountUsd;
    }
  }

  const roundedMrr = Math.round(mrrUsd * 100) / 100;

  return {
    paidSubscribers: proCount + proPlusCount,
    proCount,
    proPlusCount,
    proMonthlyCount: proCount,
    proAnnualCount: 0,
    proPlusMonthlyCount: proPlusCount,
    proPlusAnnualCount: 0,
    trialingCount: 0,
    pastDueCount,
    unknownPriceCount: 0,
    mrrUsd: roundedMrr,
    arrUsd: Math.round(roundedMrr * 12 * 100) / 100,
  };
}

async function getProfileCounts(): Promise<{
  totalUsers: number;
  signupsLast30Days: number;
  compCount: number;
  rows: Array<Record<string, unknown>>;
}> {
  const admin = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString();

  const [profilesResult, recentResult] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "subscription_tier, subscription_status, billing_source, created_at"
      ),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", cutoff),
  ]);

  const rows = (profilesResult.data ?? []) as Array<Record<string, unknown>>;
  let compCount = 0;

  for (const row of rows) {
    const tier = row.subscription_tier as SubscriptionTier;
    const status = row.subscription_status as string;
    const billingSource = row.billing_source as string | null;

    if (billingSource === "comp" && isPaidActive(tier, status)) {
      compCount += 1;
    }
  }

  return {
    totalUsers: rows.length,
    signupsLast30Days: recentResult.count ?? 0,
    compCount,
    rows,
  };
}

export async function getAdminOverviewMetrics(): Promise<AdminOverviewMetrics> {
  const [{ totalUsers, signupsLast30Days, compCount, rows }, stripeSnapshot] =
    await Promise.all([getProfileCounts(), getStripeRevenueSnapshot()]);

  if (stripeSnapshot) {
    return {
      totalUsers,
      signupsLast30Days,
      compCount,
      stripeConnected: true,
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

  const estimate = profileBasedEstimate(rows);

  return {
    totalUsers,
    signupsLast30Days,
    compCount,
    stripeConnected: false,
    revenueSource: "profile_estimate",
    revenueFetchedAt: null,
    ...estimate,
  };
}
