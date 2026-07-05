import { createAdminClient } from "@/lib/supabase/admin";
import { PRO_PLUS_PRICING, PRO_PRICING } from "@/lib/billing/pricing";
import type { SubscriptionTier } from "@/lib/billing/types";

export interface AdminOverviewMetrics {
  totalUsers: number;
  paidSubscribers: number;
  proCount: number;
  proPlusCount: number;
  compCount: number;
  estimatedMrrUsd: number;
  estimatedArrUsd: number;
  signupsLast30Days: number;
  pastDueCount: number;
}

function isPaidActive(tier: SubscriptionTier, status: string): boolean {
  return (
    (tier === "pro" || tier === "pro_plus") &&
    (status === "active" || status === "trialing")
  );
}

export async function getAdminOverviewMetrics(): Promise<AdminOverviewMetrics> {
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

  const rows = profilesResult.data ?? [];
  let proCount = 0;
  let proPlusCount = 0;
  let compCount = 0;
  let pastDueCount = 0;
  let estimatedMrrUsd = 0;

  for (const row of rows) {
    const tier = row.subscription_tier as SubscriptionTier;
    const status = row.subscription_status as string;
    const billingSource = row.billing_source as string | null;

    if (status === "past_due") {
      pastDueCount += 1;
    }

    if (billingSource === "comp" && isPaidActive(tier, status)) {
      compCount += 1;
      continue;
    }

    if (!isPaidActive(tier, status)) {
      continue;
    }

    if (tier === "pro") {
      proCount += 1;
      estimatedMrrUsd += PRO_PRICING.monthly.amountUsd;
    } else if (tier === "pro_plus") {
      proPlusCount += 1;
      estimatedMrrUsd += PRO_PLUS_PRICING.monthly.amountUsd;
    }
  }

  const paidSubscribers = proCount + proPlusCount;

  return {
    totalUsers: rows.length,
    paidSubscribers,
    proCount,
    proPlusCount,
    compCount,
    estimatedMrrUsd: Math.round(estimatedMrrUsd * 100) / 100,
    estimatedArrUsd: Math.round(estimatedMrrUsd * 12 * 100) / 100,
    signupsLast30Days: recentResult.count ?? 0,
    pastDueCount,
  };
}
