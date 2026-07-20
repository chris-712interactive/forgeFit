import test from "node:test";
import assert from "node:assert/strict";
import {
  computeCommissionCents,
  estimateStripeFeeCents,
  isTierEligible,
  periodMonthFromDate,
  resolveCommissionBaseCents,
  shouldSkipResidual,
} from "./commission-math";

test("percent of gross", () => {
  const result = computeCommissionCents({
    commissionType: "percent",
    commissionBase: "gross",
    percentBps: 2000,
    cpaCents: null,
    grossCents: 899,
    feeCents: 56,
    taxCents: 0,
    isFirstPaidInvoice: true,
  });
  assert.equal(result.baseCents, 899);
  assert.equal(result.commissionCents, Math.floor((899 * 2000) / 10000));
  assert.equal(result.cpaCents, 0);
});

test("percent of net_of_fees", () => {
  const result = computeCommissionCents({
    commissionType: "percent",
    commissionBase: "net_of_fees",
    percentBps: 2000,
    cpaCents: null,
    grossCents: 899,
    feeCents: 56,
    taxCents: 0,
    isFirstPaidInvoice: true,
  });
  assert.equal(result.baseCents, 843);
  assert.equal(result.commissionCents, Math.floor((843 * 2000) / 10000));
});

test("net_of_fees_and_tax subtracts both", () => {
  assert.equal(
    resolveCommissionBaseCents({
      commissionBase: "net_of_fees_and_tax",
      grossCents: 1000,
      feeCents: 50,
      taxCents: 70,
    }),
    880
  );
});

test("CPA only on first paid invoice", () => {
  const first = computeCommissionCents({
    commissionType: "cpa",
    commissionBase: "gross",
    percentBps: null,
    cpaCents: 500,
    grossCents: 899,
    feeCents: 56,
    taxCents: 0,
    isFirstPaidInvoice: true,
  });
  assert.equal(first.commissionCents, 500);

  const later = computeCommissionCents({
    commissionType: "cpa",
    commissionBase: "gross",
    percentBps: null,
    cpaCents: 500,
    grossCents: 899,
    feeCents: 56,
    taxCents: 0,
    isFirstPaidInvoice: false,
  });
  assert.equal(later.commissionCents, 0);
});

test("hybrid adds CPA once plus percent", () => {
  const result = computeCommissionCents({
    commissionType: "hybrid",
    commissionBase: "gross",
    percentBps: 1000,
    cpaCents: 500,
    grossCents: 1000,
    feeCents: 0,
    taxCents: 0,
    isFirstPaidInvoice: true,
  });
  assert.equal(result.percentCommissionCents, 100);
  assert.equal(result.cpaCents, 500);
  assert.equal(result.commissionCents, 600);
});

test("estimateStripeFeeCents matches 2.9% + 30¢", () => {
  assert.equal(estimateStripeFeeCents(1000), Math.round(1000 * 0.029) + 30);
  assert.equal(estimateStripeFeeCents(0), 0);
});

test("residual lifetime never skips; fixed months can", () => {
  const attributedAt = new Date("2024-01-01T00:00:00.000Z");
  assert.equal(
    shouldSkipResidual({
      durationMonths: null,
      attributedAt,
      invoicePaidAt: new Date("2030-01-01T00:00:00.000Z"),
    }),
    false
  );
  assert.equal(
    shouldSkipResidual({
      durationMonths: 12,
      attributedAt,
      invoicePaidAt: new Date("2025-02-01T00:00:00.000Z"),
    }),
    true
  );
});

test("tier eligibility defaults to pro and pro_plus", () => {
  assert.equal(isTierEligible(null, "pro"), true);
  assert.equal(isTierEligible(["pro_plus"], "pro"), false);
  assert.equal(isTierEligible(["pro"], null), false);
});

test("periodMonthFromDate uses UTC", () => {
  assert.equal(
    periodMonthFromDate(new Date("2026-07-20T15:00:00.000Z")),
    "2026-07"
  );
});
