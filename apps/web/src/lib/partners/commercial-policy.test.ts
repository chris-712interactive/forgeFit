import test from "node:test";
import assert from "node:assert/strict";
import {
  earliestPayoutDateUtc,
  isPayoutPeriodMature,
  isSelfReferralEmail,
  meetsPayoutMinimum,
  taxFormAllowsPayout,
} from "./commercial-policy";

test("self-referral matches emails case-insensitively", () => {
  assert.equal(
    isSelfReferralEmail({
      memberEmail: " Partner@Gym.com ",
      partnerContactEmail: "partner@gym.com",
    }),
    true
  );
  assert.equal(
    isSelfReferralEmail({
      memberEmail: "user@gym.com",
      partnerContactEmail: "partner@gym.com",
    }),
    false
  );
  assert.equal(
    isSelfReferralEmail({
      memberEmail: null,
      partnerContactEmail: "partner@gym.com",
    }),
    false
  );
});

test("tax form gate", () => {
  assert.equal(taxFormAllowsPayout("none"), false);
  assert.equal(taxFormAllowsPayout("received"), true);
  assert.equal(taxFormAllowsPayout("verified"), true);
});

test("Net-30 after July 2026 is payable on/after Aug 30 UTC", () => {
  const earliest = earliestPayoutDateUtc({
    periodMonth: "2026-07",
    netDays: 30,
  });
  assert.ok(earliest);
  assert.equal(earliest.toISOString().slice(0, 10), "2026-08-30");

  assert.equal(
    isPayoutPeriodMature({
      periodMonth: "2026-07",
      netDays: 30,
      asOf: new Date("2026-08-29T12:00:00.000Z"),
    }),
    false
  );
  assert.equal(
    isPayoutPeriodMature({
      periodMonth: "2026-07",
      netDays: 30,
      asOf: new Date("2026-08-30T00:00:00.000Z"),
    }),
    true
  );
});

test("payout minimum", () => {
  assert.equal(
    meetsPayoutMinimum({ amountCents: 4999, minimumCents: 5000 }),
    false
  );
  assert.equal(
    meetsPayoutMinimum({ amountCents: 5000, minimumCents: 5000 }),
    true
  );
});
