import type { CommissionBase, CommissionType } from "./types";
import { isResidualActive } from "./types";

export interface CommissionMathInput {
  commissionType: CommissionType;
  commissionBase: CommissionBase;
  percentBps: number | null;
  cpaCents: number | null;
  /** Gross amount paid on the invoice (cents). */
  grossCents: number;
  feeCents: number;
  taxCents: number;
  /** True if this user+partner has never received a CPA accrual. */
  isFirstPaidInvoice: boolean;
}

export interface CommissionMathResult {
  baseCents: number;
  percentCommissionCents: number;
  cpaCents: number;
  commissionCents: number;
}

/** Estimate Stripe US card fee when balance transaction fee is unavailable. */
export function estimateStripeFeeCents(grossCents: number): number {
  if (grossCents <= 0) return 0;
  return Math.round(grossCents * 0.029) + 30;
}

export function resolveCommissionBaseCents(input: {
  commissionBase: CommissionBase;
  grossCents: number;
  feeCents: number;
  taxCents: number;
}): number {
  const gross = Math.max(0, input.grossCents);
  const fee = Math.max(0, input.feeCents);
  const tax = Math.max(0, input.taxCents);

  switch (input.commissionBase) {
    case "gross":
      return gross;
    case "net_of_fees":
      return Math.max(0, gross - fee);
    case "net_of_fees_and_tax":
      return Math.max(0, gross - fee - tax);
    default:
      return Math.max(0, gross - fee);
  }
}

export function computeCommissionCents(
  input: CommissionMathInput
): CommissionMathResult {
  const baseCents = resolveCommissionBaseCents({
    commissionBase: input.commissionBase,
    grossCents: input.grossCents,
    feeCents: input.feeCents,
    taxCents: input.taxCents,
  });

  let percentCommissionCents = 0;
  if (
    (input.commissionType === "percent" || input.commissionType === "hybrid") &&
    input.percentBps != null &&
    input.percentBps > 0
  ) {
    percentCommissionCents = Math.floor(
      (baseCents * input.percentBps) / 10000
    );
  }

  let cpaCents = 0;
  if (
    (input.commissionType === "cpa" || input.commissionType === "hybrid") &&
    input.isFirstPaidInvoice &&
    input.cpaCents != null &&
    input.cpaCents > 0
  ) {
    cpaCents = input.cpaCents;
  }

  if (input.commissionType === "cpa") {
    return {
      baseCents,
      percentCommissionCents: 0,
      cpaCents,
      commissionCents: cpaCents,
    };
  }

  return {
    baseCents,
    percentCommissionCents,
    cpaCents,
    commissionCents: percentCommissionCents + cpaCents,
  };
}

export function periodMonthFromDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function shouldSkipResidual(input: {
  durationMonths: number | null;
  attributedAt: Date;
  invoicePaidAt: Date;
}): boolean {
  return !isResidualActive({
    durationMonths: input.durationMonths,
    attributedAt: input.attributedAt,
    asOf: input.invoicePaidAt,
  });
}

export function isTierEligible(
  eligibleTiers: string[] | null | undefined,
  tier: string | null | undefined
): boolean {
  if (!tier) return false;
  const list = eligibleTiers?.length ? eligibleTiers : ["pro", "pro_plus"];
  return list.includes(tier);
}
