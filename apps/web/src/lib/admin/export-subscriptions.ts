import {
  getCompStripeExclusions,
  isCompStripeSubscription,
} from "@/lib/admin/comp-exclusions";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAllStripePriceIds,
  getStripe,
  hasStripeSecretKey,
  readSubscriptionItemPriceId,
  tierFromStripePriceId,
} from "@/lib/billing/stripe";
import type Stripe from "stripe";
import type { PaidTier } from "@/lib/billing/types";

export interface SubscriptionExportRow {
  email: string;
  tier: string;
  interval: string;
  status: string;
  billingSource: string;
  stripeSubscriptionId: string;
  mrrUsd: number;
}

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

function subscriptionMrrUsd(subscription: Stripe.Subscription): number {
  const item = subscription.items.data[0];
  const price = typeof item?.price === "string" ? null : item?.price;
  const unitAmount = price?.unit_amount;
  if (unitAmount == null) return 0;

  let monthlyUsd = (unitAmount * (item?.quantity ?? 1)) / 100;
  const interval = price?.recurring?.interval;

  if (interval === "year") {
    monthlyUsd /= 12;
  } else if (interval === "week") {
    monthlyUsd = (monthlyUsd * 52) / 12;
  } else if (interval === "day") {
    monthlyUsd *= 30;
  }

  return Math.round(monthlyUsd * 100) / 100;
}

async function fetchSubscriptionsByStatus(
  stripe: Stripe,
  status: "active" | "trialing" | "past_due"
): Promise<Stripe.Subscription[]> {
  const subscriptions: Stripe.Subscription[] = [];
  let startingAfter: string | undefined;

  while (true) {
    const page = await stripe.subscriptions.list({
      status,
      limit: 100,
      expand: ["data.items.data.price", "data.customer"],
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

function readCustomerEmail(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string {
  if (!customer || typeof customer === "string") return "";
  if (customer.deleted) return "";
  return customer.email ?? "";
}

async function getStripeExportRows(): Promise<SubscriptionExportRow[]> {
  if (!hasStripeSecretKey()) return [];

  const stripe = getStripe();
  const compExclusions = await getCompStripeExclusions();
  const [active, trialing, pastDue] = await Promise.all([
    fetchSubscriptionsByStatus(stripe, "active"),
    fetchSubscriptionsByStatus(stripe, "trialing"),
    fetchSubscriptionsByStatus(stripe, "past_due"),
  ]);

  const seen = new Set<string>();
  const rows: SubscriptionExportRow[] = [];

  for (const subscription of [...active, ...trialing, ...pastDue]) {
    if (seen.has(subscription.id)) continue;
    seen.add(subscription.id);

    if (isCompStripeSubscription(subscription, compExclusions)) {
      continue;
    }

    const priceId = readSubscriptionItemPriceId(subscription);
    const mapped = priceId ? tierIntervalFromPriceId(priceId) : null;
    const tier = mapped?.tier ?? tierFromStripePriceId(priceId);

    if (!tier) continue;

    rows.push({
      email: readCustomerEmail(subscription.customer),
      tier,
      interval: mapped?.interval ?? "unknown",
      status: subscription.status,
      billingSource: "stripe",
      stripeSubscriptionId: subscription.id,
      mrrUsd: subscriptionMrrUsd(subscription),
    });
  }

  return rows;
}

async function getCompExportRows(): Promise<SubscriptionExportRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select(
      "email, subscription_tier, subscription_status, billing_source, stripe_subscription_id"
    )
    .eq("billing_source", "comp");

  if (error) {
    console.error("comp export failed:", error.message);
    return [];
  }

  return (data ?? [])
    .filter(
      (row) =>
        (row.subscription_tier === "pro" ||
          row.subscription_tier === "pro_plus") &&
        (row.subscription_status === "active" ||
          row.subscription_status === "trialing")
    )
    .map((row) => ({
      email: (row.email as string | null) ?? "",
      tier: row.subscription_tier as string,
      interval: "comp",
      status: row.subscription_status as string,
      billingSource: "comp",
      stripeSubscriptionId: (row.stripe_subscription_id as string | null) ?? "",
      mrrUsd: 0,
    }));
}

export async function buildSubscriptionExportRows(): Promise<
  SubscriptionExportRow[]
> {
  const [stripeRows, compRows] = await Promise.all([
    getStripeExportRows(),
    getCompExportRows(),
  ]);

  return [...stripeRows, ...compRows].sort((a, b) =>
    a.email.localeCompare(b.email)
  );
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function subscriptionRowsToCsv(rows: SubscriptionExportRow[]): string {
  const header =
    "email,tier,interval,status,billing_source,stripe_subscription_id,mrr_usd";

  const lines = rows.map((row) =>
    [
      csvEscape(row.email),
      csvEscape(row.tier),
      csvEscape(row.interval),
      csvEscape(row.status),
      csvEscape(row.billingSource),
      csvEscape(row.stripeSubscriptionId),
      String(row.mrrUsd),
    ].join(",")
  );

  return [header, ...lines].join("\n");
}
