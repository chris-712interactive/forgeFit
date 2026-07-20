/** Commercial policy helpers for partner rev-share (defaults + enforcement). */

export const DEFAULT_PAYOUT_MINIMUM_CENTS = 5000; // $50
export const DEFAULT_PAYOUT_NET_DAYS = 30;

export type TaxFormStatus = "none" | "received" | "verified";

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/** Self-referral: member email matches partner contact email. */
export function isSelfReferralEmail(input: {
  memberEmail: string | null | undefined;
  partnerContactEmail: string | null | undefined;
}): boolean {
  const member = normalizeEmail(input.memberEmail);
  const contact = normalizeEmail(input.partnerContactEmail);
  if (!member || !contact) return false;
  return member === contact;
}

export function taxFormAllowsPayout(status: TaxFormStatus | string | null): boolean {
  return status === "received" || status === "verified";
}

/**
 * Earliest UTC instant a period month can be paid under Net-N.
 * Period "2026-07" ends 2026-07-31; Net-30 → payable on/after 2026-08-30 00:00 UTC.
 */
export function earliestPayoutDateUtc(input: {
  periodMonth: string;
  netDays: number;
}): Date | null {
  if (!/^\d{4}-\d{2}$/.test(input.periodMonth)) return null;
  const [y, m] = input.periodMonth.split("-").map(Number);
  // Last calendar day of period month (UTC midnight)
  const earliest = new Date(Date.UTC(y, m, 0));
  earliest.setUTCDate(earliest.getUTCDate() + Math.max(0, input.netDays));
  return earliest;
}

export function isPayoutPeriodMature(input: {
  periodMonth: string;
  netDays: number;
  asOf?: Date;
}): boolean {
  const earliest = earliestPayoutDateUtc(input);
  if (!earliest) return false;
  const asOf = input.asOf ?? new Date();
  return asOf.getTime() >= earliest.getTime();
}

export function meetsPayoutMinimum(input: {
  amountCents: number;
  minimumCents: number;
}): boolean {
  return input.amountCents >= input.minimumCents;
}
