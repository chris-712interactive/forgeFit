import type { SubscriptionSnapshot, SubscriptionTier, AdminFeatureFlagOverrides } from "./types";
import { hasProAccess, hasProPlusAccess } from "./types";

/** Feature keys — keep in sync with docs/TIER-GATES.md */
export type TierFeature =
  | "projection_90d"
  | "projection_confidence_bands"
  | "projection_goal_date"
  | "projection_secondary_metrics"
  | "strength_analytics"
  | "pr_history"
  | "volume_analytics"
  | "nutrition_adherence"
  | "tdee_adaptive"
  | "unlimited_history"
  | "data_export"
  | "progress_photos"
  | "rule_based_insights"
  | "device_integrations"
  | "restaurant_search"
  | "ai_motivation"
  | "gamification"
  | "pr_celebration";

export const FREE_PROJECTION_HORIZON_DAYS = 30;
export const FREE_ANALYTICS_HISTORY_DAYS = 90;

const PRO_FEATURES: ReadonlySet<TierFeature> = new Set([
  "projection_90d",
  "projection_confidence_bands",
  "projection_goal_date",
  "projection_secondary_metrics",
  "strength_analytics",
  "pr_history",
  "volume_analytics",
  "nutrition_adherence",
  "tdee_adaptive",
  "unlimited_history",
  "data_export",
  "progress_photos",
  "rule_based_insights",
  "gamification",
]);

const PRO_PLUS_ONLY_FEATURES: ReadonlySet<TierFeature> = new Set([
  "device_integrations",
  "restaurant_search",
  "ai_motivation",
  "pr_celebration",
]);

/** Features included at each paid tier (Pro+ inherits all Pro features). */
export const TIER_FEATURE_MATRIX: Record<
  SubscriptionTier,
  ReadonlySet<TierFeature>
> = {
  free: new Set(),
  pro: PRO_FEATURES,
  pro_plus: new Set([...PRO_FEATURES, ...PRO_PLUS_ONLY_FEATURES]),
};

const ADMIN_FLAG_FEATURE_OVERRIDES: Partial<
  Record<keyof AdminFeatureFlagOverrides, TierFeature>
> = {
  beta_integrations: "device_integrations",
  early_ai_coach: "ai_motivation",
};

function featureGrantedByAdminFlag(
  snapshot: Pick<SubscriptionSnapshot, "adminFeatureFlags">,
  feature: TierFeature,
): boolean {
  const flags = snapshot.adminFeatureFlags;
  if (!flags) return false;

  for (const [flag, grantedFeature] of Object.entries(
    ADMIN_FLAG_FEATURE_OVERRIDES,
  ) as [keyof AdminFeatureFlagOverrides, TierFeature][]) {
    if (grantedFeature === feature && flags[flag] === true) {
      return true;
    }
  }

  return false;
}

export function hasTierFeature(
  tier: SubscriptionTier,
  feature: TierFeature,
  options?: { activeOnly?: boolean; status?: SubscriptionSnapshot["status"] }
): boolean {
  const activeOnly = options?.activeOnly ?? false;
  const status = options?.status ?? "active";

  if (activeOnly && status !== "active" && status !== "trialing") {
    return TIER_FEATURE_MATRIX.free.has(feature);
  }

  return TIER_FEATURE_MATRIX[tier].has(feature);
}

export function hasFeature(
  snapshot: Pick<SubscriptionSnapshot, "tier" | "status" | "adminFeatureFlags">,
  feature: TierFeature
): boolean {
  if (featureGrantedByAdminFlag(snapshot, feature)) {
    return true;
  }

  const tier = hasProPlusAccess(snapshot)
    ? "pro_plus"
    : hasProAccess(snapshot)
      ? "pro"
      : "free";

  return hasTierFeature(tier, feature, {
    activeOnly: true,
    status: snapshot.status,
  });
}

export function projectionHorizonDays(
  snapshot: Pick<SubscriptionSnapshot, "tier" | "status">
): number {
  return hasFeature(snapshot, "projection_90d") ? 90 : FREE_PROJECTION_HORIZON_DAYS;
}

export function analyticsHistoryDays(
  snapshot: Pick<SubscriptionSnapshot, "tier" | "status">
): number | null {
  return hasFeature(snapshot, "unlimited_history")
    ? null
    : FREE_ANALYTICS_HISTORY_DAYS;
}

export function analyticsHistoryCutoff(
  snapshot: Pick<SubscriptionSnapshot, "tier" | "status">
): Date | null {
  const days = analyticsHistoryDays(snapshot);
  if (days === null) return null;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
}
