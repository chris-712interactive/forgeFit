import { cache } from "react";
import { expireCompIfNeeded } from "@/lib/admin/comp";
import { parseAdminFeatureFlags } from "@/lib/admin/feature-flags";
import { createClient } from "@/lib/supabase/server";
import {
  hasProAccess,
  hasProPlusAccess,
  isProSubscription,
  type SubscriptionSnapshot,
  type SubscriptionStatus,
  type SubscriptionTier,
} from "./types";

export const getSubscriptionForUser = cache(async function getSubscriptionForUser(
  userId: string
): Promise<SubscriptionSnapshot> {
  await expireCompIfNeeded(userId);

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "subscription_tier, subscription_status, subscription_current_period_end, subscription_cancel_at_period_end, admin_feature_flags"
    )
    .eq("id", userId)
    .single();

  return {
    tier: (data?.subscription_tier as SubscriptionTier | undefined) ?? "free",
    status:
      (data?.subscription_status as SubscriptionStatus | undefined) ??
      "inactive",
    currentPeriodEnd: data?.subscription_current_period_end ?? null,
    cancelAtPeriodEnd: data?.subscription_cancel_at_period_end ?? false,
    adminFeatureFlags: parseAdminFeatureFlags(
      data?.admin_feature_flags as Record<string, boolean> | null | undefined
    ),
  };
});

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
