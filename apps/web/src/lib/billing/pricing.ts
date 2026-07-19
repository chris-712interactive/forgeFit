import type { PaidTier } from "./types";

/** Display pricing — keep in sync with Stripe Price objects and docs/TIER-GATES.md */
export const PRO_PRICING = {
  monthly: {
    amountUsd: 8.99,
    label: "$8.99/month",
  },
  annual: {
    amountUsd: 69.99,
    label: "$69.99/year",
    monthlyEquivalent: 5.83,
    savingsPercent: 35,
  },
} as const;

export const PRO_PLUS_PRICING = {
  monthly: {
    amountUsd: 14.99,
    label: "$14.99/month",
  },
  annual: {
    amountUsd: 119.99,
    label: "$119.99/year",
    monthlyEquivalent: 10.0,
    savingsPercent: 33,
  },
} as const;

export type BillingInterval = "monthly" | "annual";
export type BillingTier = PaidTier;

export function pricingForTier(tier: PaidTier) {
  return tier === "pro_plus" ? PRO_PLUS_PRICING : PRO_PRICING;
}

export const TIER_MARKETING: Record<
  PaidTier,
  { name: string; tagline: string; highlights: readonly string[] }
> = {
  pro: {
    name: "Pro",
    tagline: "See whether your plan is working over a full season.",
    highlights: [
      "90-day projections with confidence bands",
      "Custom workouts & CSV import",
      "Strength progression, PRs & volume trends",
      "Adaptive TDEE & nutrition adherence",
      "Community leaderboards, rivals & win feed",
      "Unlimited history, export & progress photos",
    ],
  },
  pro_plus: {
    name: "Pro+",
    tagline: "Sync wearables, log meals out, celebrate harder.",
    highlights: [
      "Everything in Pro",
      "Fitbit / Google Health sync",
      "Restaurant quick-log & saved meals",
      "Personalized coaching copy & PR celebration UX",
    ],
  },
};
