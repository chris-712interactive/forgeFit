import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  isValidPartnerCode,
  isValidPartnerSlug,
  normalizePartnerCode,
  normalizePartnerSlug,
  type AttributionModel,
  type CommissionBase,
  type CommissionType,
  type PartnerStatus,
  type PartnerType,
} from "./types";

export interface PartnerRow {
  id: string;
  slug: string;
  type: PartnerType;
  displayName: string;
  status: PartnerStatus;
  contactEmail: string | null;
  defaultLandingPath: string;
}

export interface PartnerDealRow {
  id: string;
  partnerId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  commissionType: CommissionType;
  commissionBase: CommissionBase;
  percentBps: number | null;
  cpaCents: number | null;
  durationMonths: number | null;
  clickWindowDays: number;
  attributionModel: AttributionModel;
  eligibleTiers: string[];
}

export interface PartnerCodeRow {
  id: string;
  partnerId: string;
  code: string;
  active: boolean;
}

function mapPartner(row: Record<string, unknown>): PartnerRow {
  return {
    id: row.id as string,
    slug: row.slug as string,
    type: row.type as PartnerType,
    displayName: row.display_name as string,
    status: row.status as PartnerStatus,
    contactEmail: (row.contact_email as string | null) ?? null,
    defaultLandingPath: (row.default_landing_path as string) ?? "/signup",
  };
}

function mapDeal(row: Record<string, unknown>): PartnerDealRow {
  return {
    id: row.id as string,
    partnerId: row.partner_id as string,
    effectiveFrom: row.effective_from as string,
    effectiveTo: (row.effective_to as string | null) ?? null,
    commissionType: row.commission_type as CommissionType,
    commissionBase: row.commission_base as CommissionBase,
    percentBps: (row.percent_bps as number | null) ?? null,
    cpaCents: (row.cpa_cents as number | null) ?? null,
    durationMonths: (row.duration_months as number | null) ?? null,
    clickWindowDays: row.click_window_days as number,
    attributionModel: row.attribution_model as AttributionModel,
    eligibleTiers: (row.eligible_tiers as string[]) ?? ["pro", "pro_plus"],
  };
}

export async function getActivePartnerBySlug(
  rawSlug: string
): Promise<PartnerRow | null> {
  const slug = normalizePartnerSlug(rawSlug);
  if (!isValidPartnerSlug(slug)) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("partners")
    .select(
      "id, slug, type, display_name, status, contact_email, default_landing_path"
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return null;
  return mapPartner(data);
}

export async function getActivePartnerCode(
  rawCode: string
): Promise<(PartnerCodeRow & { partner: PartnerRow }) | null> {
  const code = normalizePartnerCode(rawCode);
  if (!isValidPartnerCode(code)) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("partner_codes")
    .select(
      "id, partner_id, code, active, partners!inner(id, slug, type, display_name, status, contact_email, default_landing_path)"
    )
    .eq("code", code)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;

  const partnerRaw = data.partners as unknown as Record<string, unknown>;
  if ((partnerRaw.status as string) !== "active") return null;

  return {
    id: data.id as string,
    partnerId: data.partner_id as string,
    code: data.code as string,
    active: Boolean(data.active),
    partner: mapPartner(partnerRaw),
  };
}

/** Active deal for a partner at a point in time (latest effective_from). */
export async function getActiveDealForPartner(
  partnerId: string,
  at: Date = new Date()
): Promise<PartnerDealRow | null> {
  const admin = createAdminClient();
  const atMs = at.getTime();

  const { data, error } = await admin
    .from("partner_deals")
    .select(
      "id, partner_id, effective_from, effective_to, commission_type, commission_base, percent_bps, cpa_cents, duration_months, click_window_days, attribution_model, eligible_tiers"
    )
    .eq("partner_id", partnerId)
    .order("effective_from", { ascending: false })
    .limit(20);

  if (error || !data?.length) return null;

  const active = data.find((row) => {
    const from = new Date(row.effective_from as string).getTime();
    const to = row.effective_to
      ? new Date(row.effective_to as string).getTime()
      : null;
    return from <= atMs && (to == null || to >= atMs);
  });

  return active ? mapDeal(active) : null;
}

export function safeLandingPath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/signup";
  }
  return path;
}
