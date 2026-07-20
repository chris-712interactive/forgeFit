/** Partner attribution types + deal template defaults (Phase 14). */

export type PartnerType =
  | "gym"
  | "influencer"
  | "affiliate"
  | "referral"
  | "other";

export type PartnerStatus = "pending" | "active" | "paused" | "terminated";

export type CommissionType = "percent" | "cpa" | "hybrid";

/** How the % is applied to a paid invoice (Phase B). */
export type CommissionBase = "gross" | "net_of_fees" | "net_of_fees_and_tax";

export type AttributionModel = "first_touch" | "last_touch";

export type AttributionSource = "link" | "code" | "deep_link" | "admin_override";

export interface PartnerDealTemplate {
  commissionType: CommissionType;
  commissionBase: CommissionBase;
  percentBps: number | null;
  cpaCents: number | null;
  /** null = life of the subscription */
  durationMonths: number | null;
  clickWindowDays: number;
  attributionModel: AttributionModel;
}

/** Defaults when creating a partner in Admin — always overridable per deal. */
export function dealTemplateForPartnerType(
  type: PartnerType
): PartnerDealTemplate {
  switch (type) {
    case "gym":
      return {
        commissionType: "percent",
        commissionBase: "gross",
        percentBps: 1000,
        cpaCents: null,
        durationMonths: 12,
        clickWindowDays: 90,
        attributionModel: "first_touch",
      };
    case "affiliate":
      return {
        commissionType: "percent",
        commissionBase: "net_of_fees",
        percentBps: 1500,
        cpaCents: null,
        durationMonths: 12,
        clickWindowDays: 30,
        attributionModel: "first_touch",
      };
    case "influencer":
    case "referral":
    case "other":
    default:
      return {
        commissionType: "percent",
        commissionBase: "net_of_fees",
        percentBps: 2000,
        cpaCents: null,
        durationMonths: 12,
        clickWindowDays: 30,
        attributionModel: "first_touch",
      };
  }
}

/** Residual still active: null duration = life of subscription. */
export function isResidualActive(input: {
  durationMonths: number | null;
  attributedAt: Date;
  asOf?: Date;
}): boolean {
  if (input.durationMonths == null) {
    return true;
  }
  const asOf = input.asOf ?? new Date();
  const expires = new Date(input.attributedAt);
  expires.setUTCMonth(expires.getUTCMonth() + input.durationMonths);
  return asOf.getTime() <= expires.getTime();
}

export function isValidPartnerSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{1,62}$/.test(slug);
}

export function normalizePartnerSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function normalizePartnerCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidPartnerCode(code: string): boolean {
  return /^[A-Z0-9][A-Z0-9_-]{1,31}$/.test(code);
}
