import { createAdminClient } from "@/lib/supabase/admin";

export interface CompStripeExclusions {
  subscriptionIds: Set<string>;
  customerIds: Set<string>;
  userIds: Set<string>;
}

export async function getCompStripeExclusions(): Promise<CompStripeExclusions> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, stripe_subscription_id, stripe_customer_id")
    .eq("billing_source", "comp");

  if (error) {
    console.error("comp stripe exclusions lookup failed:", error.message);
    return {
      subscriptionIds: new Set(),
      customerIds: new Set(),
      userIds: new Set(),
    };
  }

  const subscriptionIds = new Set<string>();
  const customerIds = new Set<string>();
  const userIds = new Set<string>();

  for (const row of data ?? []) {
    userIds.add(row.id as string);
    const subId = row.stripe_subscription_id as string | null;
    const customerId = row.stripe_customer_id as string | null;
    if (subId) subscriptionIds.add(subId);
    if (customerId) customerIds.add(customerId);
  }

  return { subscriptionIds, customerIds, userIds };
}

export function isCompStripeSubscription(
  subscription: {
    id: string;
    customer: string | { id: string } | null;
    metadata?: Record<string, string> | null;
  },
  exclusions: CompStripeExclusions
): boolean {
  if (exclusions.subscriptionIds.has(subscription.id)) {
    return true;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (customerId && exclusions.customerIds.has(customerId)) {
    return true;
  }

  const userId = subscription.metadata?.user_id;
  if (userId && exclusions.userIds.has(userId)) {
    return true;
  }

  return false;
}
