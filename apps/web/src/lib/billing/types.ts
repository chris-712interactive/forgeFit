export type SubscriptionTier = "free" | "pro" | "pro_plus";

export type PaidTier = "pro" | "pro_plus";

export type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export interface SubscriptionSnapshot {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
}

function isActiveSubscription(
  status: SubscriptionStatus
): status is "active" | "trialing" {
  return status === "active" || status === "trialing";
}

/** True when user has an active Pro or Pro+ subscription (all Pro features). */
export function hasProAccess(
  snapshot: Pick<SubscriptionSnapshot, "tier" | "status">
): boolean {
  return (
    (snapshot.tier === "pro" || snapshot.tier === "pro_plus") &&
    isActiveSubscription(snapshot.status)
  );
}

/** True when user has an active Pro+ subscription. */
export function hasProPlusAccess(
  snapshot: Pick<SubscriptionSnapshot, "tier" | "status">
): boolean {
  return snapshot.tier === "pro_plus" && isActiveSubscription(snapshot.status);
}

/** @deprecated Use hasProAccess — kept for existing call sites. */
export function isProSubscription(
  snapshot: Pick<SubscriptionSnapshot, "tier" | "status">
): boolean {
  return hasProAccess(snapshot);
}
