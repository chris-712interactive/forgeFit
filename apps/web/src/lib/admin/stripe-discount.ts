import type Stripe from "stripe";
import { getStripe, hasStripeSecretKey, retrieveSubscriptionForSync } from "@/lib/billing/stripe";

const CACHE_TTL_MS = 15 * 60 * 1000;

export interface StripeCouponOption {
  id: string;
  name: string | null;
  percentOff: number | null;
  amountOff: number | null;
  duration: Stripe.Coupon.Duration;
  durationInMonths: number | null;
  valid: boolean;
}

export interface StripeSubscriptionDiscount {
  couponId: string;
  couponName: string | null;
  percentOff: number | null;
  amountOff: number | null;
  end: string | null;
}

interface CouponCacheEntry {
  expiresAt: number;
  coupons: StripeCouponOption[];
}

let couponCache: CouponCacheEntry | null = null;

function formatCouponLabel(coupon: Stripe.Coupon): string {
  const parts: string[] = [];
  if (coupon.name) {
    parts.push(coupon.name);
  } else {
    parts.push(coupon.id);
  }

  if (coupon.percent_off) {
    parts.push(`${coupon.percent_off}% off`);
  } else if (coupon.amount_off) {
    parts.push(`$${(coupon.amount_off / 100).toFixed(2)} off`);
  }

  if (coupon.duration === "repeating" && coupon.duration_in_months) {
    parts.push(`${coupon.duration_in_months} mo`);
  } else if (coupon.duration === "once") {
    parts.push("once");
  } else if (coupon.duration === "forever") {
    parts.push("forever");
  }

  return parts.join(" · ");
}

export async function listStripeCoupons(): Promise<StripeCouponOption[]> {
  if (!hasStripeSecretKey()) {
    return [];
  }

  const now = Date.now();
  if (couponCache && couponCache.expiresAt > now) {
    return couponCache.coupons;
  }

  try {
    const stripe = getStripe();
    const coupons: StripeCouponOption[] = [];
    let startingAfter: string | undefined;

    while (true) {
      const page = await stripe.coupons.list({
        limit: 100,
        starting_after: startingAfter,
      });

      for (const coupon of page.data) {
        if (!coupon.valid) continue;
        coupons.push({
          id: coupon.id,
          name: coupon.name,
          percentOff: coupon.percent_off ?? null,
          amountOff: coupon.amount_off ?? null,
          duration: coupon.duration,
          durationInMonths: coupon.duration_in_months ?? null,
          valid: coupon.valid,
        });
      }

      if (!page.has_more || page.data.length === 0) {
        break;
      }

      startingAfter = page.data[page.data.length - 1]?.id;
    }

    coupons.sort((a, b) =>
      formatCouponLabel({ id: a.id, name: a.name } as Stripe.Coupon).localeCompare(
        formatCouponLabel({ id: b.id, name: b.name } as Stripe.Coupon)
      )
    );

    couponCache = { expiresAt: now + CACHE_TTL_MS, coupons };
    return coupons;
  } catch (error) {
    console.error("list stripe coupons failed:", error);
    return [];
  }
}

function readCouponFromDiscount(
  discount: Stripe.Discount | null | undefined
): StripeSubscriptionDiscount | null {
  if (!discount) return null;

  const withCoupon = discount as Stripe.Discount & {
    coupon?: Stripe.Coupon | string | null;
  };
  const coupon = withCoupon.coupon;
  if (!coupon || typeof coupon === "string") {
    return null;
  }

  return {
    couponId: coupon.id,
    couponName: coupon.name,
    percentOff: coupon.percent_off ?? null,
    amountOff: coupon.amount_off ?? null,
    end: discount.end ? new Date(discount.end * 1000).toISOString() : null,
  };
}

export async function getStripeSubscriptionDiscount(
  subscriptionId: string
): Promise<StripeSubscriptionDiscount | null> {
  if (!hasStripeSecretKey()) {
    return null;
  }

  try {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["discounts", "discount.coupon"],
    });

    const withLegacy = subscription as Stripe.Subscription & {
      discount?: Stripe.Discount | null;
    };

    const legacy = readCouponFromDiscount(withLegacy.discount);
    if (legacy) {
      return legacy;
    }

    const discounts = subscription.discounts ?? [];
    for (const entry of discounts) {
      const discount =
        typeof entry === "string"
          ? null
          : readCouponFromDiscount(entry as Stripe.Discount);
      if (discount) {
        return discount;
      }
    }

    return null;
  } catch (error) {
    console.error("get stripe subscription discount failed:", error);
    return null;
  }
}

export async function applyStripeSubscriptionCoupon(input: {
  subscriptionId: string;
  couponId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasStripeSecretKey()) {
    return { ok: false, error: "Stripe is not configured." };
  }

  try {
    const stripe = getStripe();
    await retrieveSubscriptionForSync(stripe, input.subscriptionId);

    await stripe.subscriptions.update(input.subscriptionId, {
      discounts: [{ coupon: input.couponId }],
    });

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not apply coupon.";
    return { ok: false, error: message };
  }
}

export async function removeStripeSubscriptionDiscount(
  subscriptionId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasStripeSecretKey()) {
    return { ok: false, error: "Stripe is not configured." };
  }

  try {
    const stripe = getStripe();
    await stripe.subscriptions.update(subscriptionId, {
      discounts: [],
    });
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not remove discount.";
    return { ok: false, error: message };
  }
}

export function formatCouponOptionLabel(coupon: StripeCouponOption): string {
  return formatCouponLabel({
    id: coupon.id,
    name: coupon.name,
    percent_off: coupon.percentOff ?? undefined,
    amount_off: coupon.amountOff ?? undefined,
    duration: coupon.duration,
    duration_in_months: coupon.durationInMonths ?? undefined,
  } as Stripe.Coupon);
}
