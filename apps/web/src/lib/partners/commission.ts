import "server-only";

import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, tierFromStripePriceId } from "@/lib/billing/stripe";
import {
  computeCommissionCents,
  estimateStripeFeeCents,
  isTierEligible,
  periodMonthFromDate,
  shouldSkipResidual,
} from "./commission-math";
import { isSelfReferralEmail } from "./commercial-policy";
import type { CommissionBase, CommissionType } from "./types";

export type AccrueResult =
  | { ok: true; commissionId: string; commissionCents: number }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

export type ReverseResult =
  | { ok: true; commissionId: string; commissionCents: number }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

type DealRow = {
  id: string;
  commission_type: CommissionType;
  commission_base: CommissionBase;
  percent_bps: number | null;
  cpa_cents: number | null;
  duration_months: number | null;
  eligible_tiers: string[] | null;
};

async function resolveUserIdFromInvoice(
  invoice: Stripe.Invoice,
  stripe: Stripe
): Promise<string | null> {
  if (invoice.metadata?.user_id) {
    return invoice.metadata.user_id;
  }

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer && !("deleted" in invoice.customer && invoice.customer.deleted)
        ? invoice.customer.id
        : null;

  if (!customerId) return null;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;
  return customer.metadata?.user_id ?? null;
}

function readSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };
  if (typeof legacy.subscription === "string") return legacy.subscription;
  if (legacy.subscription && typeof legacy.subscription === "object") {
    return legacy.subscription.id;
  }

  const parentSub = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSub === "string") return parentSub;
  if (parentSub && typeof parentSub === "object" && "id" in parentSub) {
    return (parentSub as { id: string }).id;
  }
  return null;
}

async function resolveSubscriptionTier(
  invoice: Stripe.Invoice,
  stripe: Stripe
): Promise<string | null> {
  const subscriptionId = readSubscriptionId(invoice);
  if (!subscriptionId) return null;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price"],
    });
    const metaTier = subscription.metadata?.tier;
    if (metaTier === "pro" || metaTier === "pro_plus") return metaTier;

    const price = subscription.items.data[0]?.price;
    const priceId = typeof price === "string" ? price : price?.id;
    return tierFromStripePriceId(priceId);
  } catch {
    return null;
  }
}

async function readFeeAndTaxCents(
  invoice: Stripe.Invoice,
  stripe: Stripe
): Promise<{ feeCents: number; taxCents: number; chargeId: string | null }> {
  const legacyTax = (invoice as Stripe.Invoice & { tax?: number | null }).tax;
  const taxFromTotals =
    invoice.total_taxes?.reduce((sum, row) => sum + (row.amount ?? 0), 0) ?? 0;
  const taxCents = Math.max(0, taxFromTotals || legacyTax || 0);

  let chargeId: string | null = null;
  const legacyCharge = (invoice as Stripe.Invoice & {
    charge?: string | Stripe.Charge | null;
  }).charge;
  if (typeof legacyCharge === "string") {
    chargeId = legacyCharge;
  } else if (legacyCharge && typeof legacyCharge === "object") {
    chargeId = legacyCharge.id;
  }

  const paymentIntentRef = (invoice as Stripe.Invoice & {
    payment_intent?: string | Stripe.PaymentIntent | null;
  }).payment_intent;
  const paymentIntentId =
    typeof paymentIntentRef === "string"
      ? paymentIntentRef
      : paymentIntentRef?.id ?? null;

  if (!chargeId && paymentIntentId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["latest_charge"],
      });
      const latest = pi.latest_charge;
      chargeId = typeof latest === "string" ? latest : latest?.id ?? null;
    } catch {
      // ignore
    }
  }

  if (chargeId) {
    try {
      const charge = await stripe.charges.retrieve(chargeId, {
        expand: ["balance_transaction"],
      });
      const bt = charge.balance_transaction;
      if (bt && typeof bt !== "string" && typeof bt.fee === "number") {
        return { feeCents: bt.fee, taxCents, chargeId };
      }
    } catch {
      // fall through
    }
  }

  return {
    feeCents: estimateStripeFeeCents(invoice.amount_paid ?? 0),
    taxCents,
    chargeId,
  };
}

async function loadDealForAttribution(
  admin: ReturnType<typeof createAdminClient>,
  attribution: {
    partner_id: string;
    deal_id: string | null;
    partner_deals: unknown;
  }
): Promise<DealRow | null> {
  const embedded = attribution.partner_deals as DealRow | DealRow[] | null;
  if (embedded && !Array.isArray(embedded) && embedded.id) {
    return embedded;
  }
  if (Array.isArray(embedded) && embedded[0]?.id) {
    return embedded[0];
  }

  if (attribution.deal_id) {
    const { data } = await admin
      .from("partner_deals")
      .select(
        "id, commission_type, commission_base, percent_bps, cpa_cents, duration_months, eligible_tiers"
      )
      .eq("id", attribution.deal_id)
      .maybeSingle();
    if (data) return data as DealRow;
  }

  const { data: deals } = await admin
    .from("partner_deals")
    .select(
      "id, commission_type, commission_base, percent_bps, cpa_cents, duration_months, eligible_tiers, effective_from, effective_to"
    )
    .eq("partner_id", attribution.partner_id)
    .order("effective_from", { ascending: false })
    .limit(10);

  const now = Date.now();
  const active = (deals ?? []).find((row) => {
    const from = new Date(row.effective_from as string).getTime();
    const to = row.effective_to
      ? new Date(row.effective_to as string).getTime()
      : null;
    return from <= now && (to == null || to >= now);
  });

  return (active as DealRow | undefined) ?? null;
}

/**
 * Accrue partner commission for a paid Stripe invoice (idempotent on invoice id).
 */
export async function accrueCommissionFromInvoice(
  invoice: Stripe.Invoice,
  stripe: Stripe = getStripe()
): Promise<AccrueResult> {
  if (invoice.status !== "paid") {
    return { ok: true, skipped: true, reason: "invoice_not_paid" };
  }

  const amountPaid = invoice.amount_paid ?? 0;
  if (amountPaid <= 0) {
    return { ok: true, skipped: true, reason: "zero_amount" };
  }

  const userId = await resolveUserIdFromInvoice(invoice, stripe);
  if (!userId) {
    return { ok: true, skipped: true, reason: "no_user_id" };
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("billing_source, subscription_tier, email")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.billing_source === "comp") {
    return { ok: true, skipped: true, reason: "comp_billing" };
  }

  const { data: attribution } = await admin
    .from("user_attributions")
    .select(
      "id, partner_id, deal_id, attributed_at, partners!inner(id, status, contact_email), partner_deals(id, commission_type, commission_base, percent_bps, cpa_cents, duration_months, eligible_tiers)"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!attribution) {
    return { ok: true, skipped: true, reason: "no_attribution" };
  }

  const partner = attribution.partners as unknown as {
    id: string;
    status: string;
    contact_email: string | null;
  };
  if (partner.status !== "active") {
    return { ok: true, skipped: true, reason: "partner_inactive" };
  }

  if (
    isSelfReferralEmail({
      memberEmail: profile?.email as string | null,
      partnerContactEmail: partner.contact_email,
    })
  ) {
    return { ok: true, skipped: true, reason: "self_referral" };
  }

  const { data: portalLink } = await admin
    .from("partner_portal_users")
    .select("id")
    .eq("partner_id", attribution.partner_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (portalLink) {
    return { ok: true, skipped: true, reason: "portal_user_self_referral" };
  }

  const deal = await loadDealForAttribution(admin, {
    partner_id: attribution.partner_id as string,
    deal_id: (attribution.deal_id as string | null) ?? null,
    partner_deals: attribution.partner_deals,
  });

  if (!deal) {
    return { ok: true, skipped: true, reason: "no_deal" };
  }

  const paidAt = invoice.status_transitions?.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000)
    : new Date();

  if (
    shouldSkipResidual({
      durationMonths: deal.duration_months,
      attributedAt: new Date(attribution.attributed_at as string),
      invoicePaidAt: paidAt,
    })
  ) {
    return { ok: true, skipped: true, reason: "residual_expired" };
  }

  const tier =
    (await resolveSubscriptionTier(invoice, stripe)) ??
    (typeof profile?.subscription_tier === "string"
      ? profile.subscription_tier
      : null);

  if (!isTierEligible(deal.eligible_tiers, tier)) {
    return { ok: true, skipped: true, reason: "tier_not_eligible" };
  }

  const { count: priorCount } = await admin
    .from("partner_commissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("partner_id", attribution.partner_id)
    .eq("entry_kind", "accrual");

  const isFirstPaidInvoice = (priorCount ?? 0) === 0;

  const { feeCents, taxCents, chargeId } = await readFeeAndTaxCents(
    invoice,
    stripe
  );

  const math = computeCommissionCents({
    commissionType: deal.commission_type,
    commissionBase: deal.commission_base,
    percentBps: deal.percent_bps,
    cpaCents: deal.cpa_cents,
    grossCents: amountPaid,
    feeCents,
    taxCents,
    isFirstPaidInvoice,
  });

  if (math.commissionCents <= 0) {
    return { ok: true, skipped: true, reason: "zero_commission" };
  }

  const periodMonth = periodMonthFromDate(paidAt);

  const { data: inserted, error } = await admin
    .from("partner_commissions")
    .insert({
      partner_id: attribution.partner_id,
      user_id: userId,
      deal_id: deal.id,
      attribution_id: attribution.id,
      entry_kind: "accrual",
      stripe_invoice_id: invoice.id,
      stripe_charge_id: chargeId,
      period_month: periodMonth,
      gross_cents: amountPaid,
      fee_cents: feeCents,
      tax_cents: taxCents,
      base_cents: math.baseCents,
      commission_cents: math.commissionCents,
      commission_base: deal.commission_base,
      percent_bps: deal.percent_bps,
      cpa_cents: math.cpaCents,
      status: "pending",
      tier,
      metadata: {
        percentCommissionCents: math.percentCommissionCents,
      },
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { ok: true, skipped: true, reason: "already_accrued" };
    }
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    commissionId: inserted?.id as string,
    commissionCents: math.commissionCents,
  };
}

/**
 * Reverse a prior accrual when Stripe issues a refund (idempotent on refund id).
 */
export async function reverseCommissionFromRefund(
  charge: Stripe.Charge,
  refund: Stripe.Refund
): Promise<ReverseResult> {
  if (!refund.id) {
    return { ok: true, skipped: true, reason: "no_refund_id" };
  }

  const admin = createAdminClient();
  const chargeWithInvoice = charge as Stripe.Charge & {
    invoice?: string | Stripe.Invoice | null;
  };
  const invoiceId =
    typeof chargeWithInvoice.invoice === "string"
      ? chargeWithInvoice.invoice
      : chargeWithInvoice.invoice?.id ?? null;

  let accrual: {
    id: string;
    partner_id: string;
    user_id: string;
    deal_id: string | null;
    attribution_id: string | null;
    commission_cents: number;
    gross_cents: number;
    fee_cents: number;
    tax_cents: number;
    base_cents: number;
    commission_base: string | null;
    percent_bps: number | null;
    tier: string | null;
  } | null = null;

  if (invoiceId) {
    const { data } = await admin
      .from("partner_commissions")
      .select(
        "id, partner_id, user_id, deal_id, attribution_id, commission_cents, gross_cents, fee_cents, tax_cents, base_cents, commission_base, percent_bps, tier"
      )
      .eq("stripe_invoice_id", invoiceId)
      .eq("entry_kind", "accrual")
      .maybeSingle();
    accrual = data;
  }

  if (!accrual && charge.id) {
    const { data } = await admin
      .from("partner_commissions")
      .select(
        "id, partner_id, user_id, deal_id, attribution_id, commission_cents, gross_cents, fee_cents, tax_cents, base_cents, commission_base, percent_bps, tier"
      )
      .eq("stripe_charge_id", charge.id)
      .eq("entry_kind", "accrual")
      .maybeSingle();
    accrual = data;
  }

  if (!accrual) {
    return { ok: true, skipped: true, reason: "no_accrual" };
  }

  const refundAmount = refund.amount ?? 0;
  const gross = accrual.gross_cents || 1;
  const ratio = Math.min(1, Math.max(0, refundAmount / gross));
  const reverseCents = -Math.round(accrual.commission_cents * ratio);

  if (reverseCents === 0) {
    return { ok: true, skipped: true, reason: "zero_reversal" };
  }

  const periodMonth = periodMonthFromDate(
    refund.created ? new Date(refund.created * 1000) : new Date()
  );

  const { data: inserted, error } = await admin
    .from("partner_commissions")
    .insert({
      partner_id: accrual.partner_id,
      user_id: accrual.user_id,
      deal_id: accrual.deal_id,
      attribution_id: accrual.attribution_id,
      entry_kind: "reversal",
      reverses_commission_id: accrual.id,
      stripe_invoice_id: invoiceId,
      stripe_charge_id: charge.id,
      stripe_refund_id: refund.id,
      period_month: periodMonth,
      gross_cents: -Math.round(accrual.gross_cents * ratio),
      fee_cents: 0,
      tax_cents: 0,
      base_cents: -Math.round(accrual.base_cents * ratio),
      commission_cents: reverseCents,
      commission_base: accrual.commission_base,
      percent_bps: accrual.percent_bps,
      cpa_cents: 0,
      status: "pending",
      tier: accrual.tier,
      metadata: { refundRatio: ratio },
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { ok: true, skipped: true, reason: "already_reversed" };
    }
    return { ok: false, error: error.message };
  }

  // Mark original fully reversed when full refund
  if (ratio >= 0.999) {
    await admin
      .from("partner_commissions")
      .update({ status: "reversed" })
      .eq("id", accrual.id)
      .eq("status", "pending");
  }

  return {
    ok: true,
    commissionId: inserted?.id as string,
    commissionCents: reverseCents,
  };
}
