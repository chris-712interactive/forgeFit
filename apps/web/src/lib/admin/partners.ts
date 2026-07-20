import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import {
  dealTemplateForPartnerType,
  isValidPartnerCode,
  isValidPartnerSlug,
  normalizePartnerCode,
  normalizePartnerSlug,
  type CommissionBase,
  type CommissionType,
  type PartnerStatus,
  type PartnerType,
} from "@/lib/partners/types";

export interface AdminPartnerListItem {
  id: string;
  slug: string;
  type: PartnerType;
  displayName: string;
  status: PartnerStatus;
  contactEmail: string | null;
  defaultLandingPath: string;
  createdAt: string;
  activeDeal: {
    id: string;
    commissionType: CommissionType;
    commissionBase: CommissionBase;
    percentBps: number | null;
    cpaCents: number | null;
    durationMonths: number | null;
    clickWindowDays: number;
  } | null;
  codes: string[];
}

export async function listPartnersForAdmin(): Promise<AdminPartnerListItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("partners")
    .select(
      "id, slug, type, display_name, status, contact_email, default_landing_path, created_at, partner_deals(id, commission_type, commission_base, percent_bps, cpa_cents, duration_months, click_window_days, effective_from, effective_to), partner_codes(code, active)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[partners] list failed:", error.message);
    return [];
  }

  const now = Date.now();

  return (data ?? []).map((row) => {
    const deals = (row.partner_deals as unknown as Array<Record<string, unknown>>) ?? [];
    const activeDeal =
      deals
        .filter((deal) => {
          const from = new Date(deal.effective_from as string).getTime();
          const to = deal.effective_to
            ? new Date(deal.effective_to as string).getTime()
            : null;
          return from <= now && (to == null || to >= now);
        })
        .sort(
          (a, b) =>
            new Date(b.effective_from as string).getTime() -
            new Date(a.effective_from as string).getTime()
        )[0] ?? null;

    const codes = (
      (row.partner_codes as unknown as Array<{ code: string; active: boolean }>) ??
      []
    )
      .filter((c) => c.active)
      .map((c) => c.code);

    return {
      id: row.id as string,
      slug: row.slug as string,
      type: row.type as PartnerType,
      displayName: row.display_name as string,
      status: row.status as PartnerStatus,
      contactEmail: (row.contact_email as string | null) ?? null,
      defaultLandingPath: (row.default_landing_path as string) ?? "/signup",
      createdAt: row.created_at as string,
      activeDeal: activeDeal
        ? {
            id: activeDeal.id as string,
            commissionType: activeDeal.commission_type as CommissionType,
            commissionBase: activeDeal.commission_base as CommissionBase,
            percentBps: (activeDeal.percent_bps as number | null) ?? null,
            cpaCents: (activeDeal.cpa_cents as number | null) ?? null,
            durationMonths: (activeDeal.duration_months as number | null) ?? null,
            clickWindowDays: activeDeal.click_window_days as number,
          }
        : null,
      codes,
    };
  });
}

export interface CreatePartnerInput {
  adminUserId: string;
  slug: string;
  type: PartnerType;
  displayName: string;
  contactEmail?: string;
  code?: string;
  /** null = life of subscription; omit to use type template */
  durationMonths?: number | null;
  percentBps?: number;
  clickWindowDays?: number;
  commissionBase?: CommissionBase;
}

export async function createPartnerWithDeal(
  input: CreatePartnerInput
): Promise<{ ok: true; partnerId: string } | { ok: false; error: string }> {
  const slug = normalizePartnerSlug(input.slug);
  if (!isValidPartnerSlug(slug)) {
    return {
      ok: false,
      error:
        "Slug must be 2–63 chars: lowercase letters, numbers, hyphen, underscore.",
    };
  }

  const displayName = input.displayName.trim();
  if (displayName.length < 2) {
    return { ok: false, error: "Display name is required." };
  }

  let code: string | null = null;
  if (input.code?.trim()) {
    code = normalizePartnerCode(input.code);
    if (!isValidPartnerCode(code)) {
      return {
        ok: false,
        error: "Code must be 2–32 chars: A–Z, 0–9, hyphen, underscore.",
      };
    }
  }

  const template = dealTemplateForPartnerType(input.type);
  const durationMonths =
    input.durationMonths === undefined
      ? template.durationMonths
      : input.durationMonths;
  const percentBps = input.percentBps ?? template.percentBps ?? 2000;
  const clickWindowDays = input.clickWindowDays ?? template.clickWindowDays;
  const commissionBase = input.commissionBase ?? template.commissionBase;

  const admin = createAdminClient();

  const { data: partner, error: partnerError } = await admin
    .from("partners")
    .insert({
      slug,
      type: input.type,
      display_name: displayName,
      status: "active",
      contact_email: input.contactEmail?.trim() || null,
      default_landing_path: "/signup",
    })
    .select("id")
    .maybeSingle();

  if (partnerError || !partner) {
    if (partnerError?.code === "23505") {
      return { ok: false, error: "That slug is already in use." };
    }
    return {
      ok: false,
      error: partnerError?.message ?? "Failed to create partner.",
    };
  }

  const partnerId = partner.id as string;

  const { error: dealError } = await admin.from("partner_deals").insert({
    partner_id: partnerId,
    commission_type: template.commissionType,
    commission_base: commissionBase,
    percent_bps: percentBps,
    cpa_cents: template.cpaCents,
    duration_months: durationMonths,
    click_window_days: clickWindowDays,
    attribution_model: template.attributionModel,
  });

  if (dealError) {
    await admin.from("partners").delete().eq("id", partnerId);
    return { ok: false, error: dealError.message };
  }

  if (code) {
    const { error: codeError } = await admin.from("partner_codes").insert({
      partner_id: partnerId,
      code,
      active: true,
    });
    if (codeError) {
      await admin.from("partners").delete().eq("id", partnerId);
      if (codeError.code === "23505") {
        return { ok: false, error: "That promo code is already in use." };
      }
      return { ok: false, error: codeError.message };
    }
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: "partner.create",
    payload: {
      partnerId,
      slug,
      type: input.type,
      durationMonths,
      clickWindowDays,
      percentBps,
      commissionBase,
      code,
    },
  });

  return { ok: true, partnerId };
}

export async function updatePartnerStatus(input: {
  adminUserId: string;
  partnerId: string;
  status: PartnerStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("partners")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.partnerId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: "partner.status",
    payload: { partnerId: input.partnerId, status: input.status },
  });

  return { ok: true };
}
