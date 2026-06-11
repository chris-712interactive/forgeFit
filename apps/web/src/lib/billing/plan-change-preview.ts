import type { BillingInterval } from "./pricing";
import { pricingForTier } from "./pricing";
import type { PaidTier } from "./types";

export interface PlanChangePreview {
  currentTier: PaidTier | null;
  targetTier: PaidTier;
  interval: BillingInterval;
  currency: string;
  /** Unix timestamp — pass back when confirming so Stripe matches the preview. */
  prorationDate: number;
  /** Immediate charge for upgrades (proration only, not the next renewal). */
  dueTodayCents: number;
  /** Credit applied on downgrade (unused time on higher tier). */
  creditCents: number;
  currentRecurringLabel: string;
  newRecurringLabel: string;
  isUpgrade: boolean;
  periodEndLabel: string | null;
  /** Human-readable proration line descriptions from Stripe preview. */
  lineSummaries: string[];
  prorationLines: { description: string; amountCents: number }[];
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
