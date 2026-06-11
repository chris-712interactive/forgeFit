import Stripe from "stripe";
import type { PaidTier } from "./types";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export interface StripePriceIdSet {
  monthly: string;
  annual: string;
}

function readPriceId(
  primaryMonthly: string | undefined,
  primaryAnnual: string | undefined,
  legacyMonthly?: string,
  legacyAnnual?: string
): StripePriceIdSet | null {
  const monthly = primaryMonthly ?? legacyMonthly;
  const annual = primaryAnnual ?? legacyAnnual;

  if (!monthly || !annual) return null;
  return { monthly, annual };
}

/** All Stripe price IDs keyed by paid tier. */
export function getAllStripePriceIds(): Record<PaidTier, StripePriceIdSet | null> {
  const legacyMonthly = process.env.STRIPE_PRICE_ID_MONTHLY;
  const legacyAnnual = process.env.STRIPE_PRICE_ID_ANNUAL;

  return {
    pro: readPriceId(
      process.env.STRIPE_PRO_PRICE_ID_MONTHLY,
      process.env.STRIPE_PRO_PRICE_ID_ANNUAL,
      legacyMonthly,
      legacyAnnual
    ),
    pro_plus: readPriceId(
      process.env.STRIPE_PRO_PLUS_PRICE_ID_MONTHLY,
      process.env.STRIPE_PRO_PLUS_PRICE_ID_ANNUAL
    ),
  };
}

export function getStripePriceIds(tier: PaidTier): StripePriceIdSet {
  const prices = getAllStripePriceIds()[tier];
  if (!prices) {
    throw new Error(
      tier === "pro_plus"
        ? "STRIPE_PRO_PLUS_PRICE_ID_MONTHLY and STRIPE_PRO_PLUS_PRICE_ID_ANNUAL must be configured."
        : "STRIPE_PRO_PRICE_ID_MONTHLY and STRIPE_PRO_PRICE_ID_ANNUAL (or legacy STRIPE_PRICE_ID_*) must be configured."
    );
  }

  return prices;
}

/** Resolve subscription tier from a Stripe subscription price ID. */
export function tierFromStripePriceId(priceId: string | undefined): PaidTier | null {
  if (!priceId) return null;

  const all = getAllStripePriceIds();
  if (
    all.pro_plus &&
    (priceId === all.pro_plus.monthly || priceId === all.pro_plus.annual)
  ) {
    return "pro_plus";
  }
  if (all.pro && (priceId === all.pro.monthly || priceId === all.pro.annual)) {
    return "pro";
  }

  return null;
}

export function isStripeConfigured(): boolean {
  const all = getAllStripePriceIds();
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      all.pro &&
      all.pro_plus
  );
}

/** True when Pro checkout can run (Pro+ prices optional). */
export function isStripeProConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      getAllStripePriceIds().pro
  );
}
