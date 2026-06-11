import type { BillingInterval } from "./pricing";
import { pricingForTier } from "./pricing";
import type { PaidTier } from "./types";

export interface PlanChangePreview {
  currentTier: PaidTier | null;
  targetTier: PaidTier;
  interval: BillingInterval;
  currency: string;
  /** Amount Stripe will attempt to collect now (can be 0 if applied to next invoice). */
  dueTodayCents: number;
  currentRecurringLabel: string;
  newRecurringLabel: string;
  isUpgrade: boolean;
  periodEndLabel: string | null;
  /** Human-readable invoice line summaries from Stripe preview. */
  lineSummaries: string[];
}

export type PlanChangePreviewResponse = PlanChangePreview;

export function recurringLabelFor(
  tier: PaidTier,
  interval: BillingInterval
): string {
  const pricing = pricingForTier(tier);
  return interval === "annual" ? pricing.annual.label : pricing.monthly.label;
}

const TIER_RANK: Record<PaidTier, number> = {
  pro: 1,
  pro_plus: 2,
};

export function isPlanUpgrade(
  current: PaidTier | null,
  target: PaidTier
): boolean {
  if (!current) return true;
  return TIER_RANK[target] > TIER_RANK[current];
}
