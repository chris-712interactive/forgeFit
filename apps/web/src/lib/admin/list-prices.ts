import type { PaidTier } from "@/lib/billing/types";

/** Public list prices — keep in sync with docs/TIER-GATES.md */
export const LIST_PRICES_USD: Record<
  PaidTier,
  { monthly: number; annual: number }
> = {
  pro: { monthly: 8.99, annual: 69.99 },
  pro_plus: { monthly: 14.99, annual: 119.99 },
};

export function compArrEquivalentUsd(tier: PaidTier): number {
  return LIST_PRICES_USD[tier].annual;
}
