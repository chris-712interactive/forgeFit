import { createClient } from "@/lib/supabase/server";
import {
  hasProAccess,
  hasProPlusAccess,
  isProSubscription,
  type SubscriptionSnapshot,
  type SubscriptionStatus,
  type SubscriptionTier,
} from "./types";

export async function getSubscriptionForUser(
  userId: string
): Promise<SubscriptionSnapshot> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "subscription_tier, subscription_status, subscription_current_period_end"
    )
    .eq("id", userId)
    .single();

  return {
    tier: (data?.subscription_tier as SubscriptionTier | undefined) ?? "free",
    status:
      (data?.subscription_status as SubscriptionStatus | undefined) ??
      "inactive",
    currentPeriodEnd: data?.subscription_current_period_end ?? null,
  };
}

export async function getCurrentUserSubscription(): Promise<SubscriptionSnapshot | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return getSubscriptionForUser(user.id);
}

/** Active Pro or Pro+ — passes all Pro-tier gates. */
export async function isCurrentUserPro(): Promise<boolean> {
  const subscription = await getCurrentUserSubscription();
  if (!subscription) return false;
  return hasProAccess(subscription);
}

/** Active Pro+ only — passes Pro+ exclusive gates. */
export async function isCurrentUserProPlus(): Promise<boolean> {
  const subscription = await getCurrentUserSubscription();
  if (!subscription) return false;
  return hasProPlusAccess(subscription);
}

export { hasProAccess, hasProPlusAccess, isProSubscription };
