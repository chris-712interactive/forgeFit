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
  payoutMinimumCents: number;
  payoutNetDays: number;
  taxFormStatus: string;
  portalUsers: Array<{ userId: string; email: string | null }>;
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
      "id, slug, type, display_name, status, contact_email, default_landing_path, created_at, payout_minimum_cents, payout_net_days, tax_form_status, partner_deals(id, commission_type, commission_base, percent_bps, cpa_cents, duration_months, click_window_days, effective_from, effective_to), partner_codes(code, active), partner_portal_users(user_id)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[partners] list failed:", error.message);
    // Pre-migration fallback (14C columns missing)
    if (
      error.message.includes("payout_minimum") ||
      error.message.includes("partner_portal_users") ||
      error.message.includes("tax_form")
    ) {
      const { data: legacy } = await admin
        .from("partners")
        .select(
          "id, slug, type, display_name, status, contact_email, default_landing_path, created_at, partner_deals(id, commission_type, commission_base, percent_bps, cpa_cents, duration_months, click_window_days, effective_from, effective_to), partner_codes(code, active)"
        )
        .order("created_at", { ascending: false });
      return (legacy ?? []).map((row) => {
        const deals =
          (row.partner_deals as unknown as Array<Record<string, unknown>>) ??
          [];
        const activeDeal =
          deals
            .filter((deal) => {
              const from = new Date(deal.effective_from as string).getTime();
              const to = deal.effective_to
                ? new Date(deal.effective_to as string).getTime()
                : null;
              return from <= Date.now() && (to == null || to >= Date.now());
            })
            .sort(
              (a, b) =>
                new Date(b.effective_from as string).getTime() -
                new Date(a.effective_from as string).getTime()
            )[0] ?? null;
        const codes = (
          (row.partner_codes as unknown as Array<{
            code: string;
            active: boolean;
          }>) ?? []
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
          payoutMinimumCents: 5000,
          payoutNetDays: 30,
          taxFormStatus: "none",
          portalUsers: [],
          activeDeal: activeDeal
            ? {
                id: activeDeal.id as string,
                commissionType: activeDeal.commission_type as CommissionType,
                commissionBase: activeDeal.commission_base as CommissionBase,
                percentBps: (activeDeal.percent_bps as number | null) ?? null,
                cpaCents: (activeDeal.cpa_cents as number | null) ?? null,
                durationMonths:
                  (activeDeal.duration_months as number | null) ?? null,
                clickWindowDays: activeDeal.click_window_days as number,
              }
            : null,
          codes,
        };
      });
    }
    return [];
  }

  const now = Date.now();
  const portalUserIds = new Set<string>();
  for (const row of data ?? []) {
    const links =
      (row.partner_portal_users as unknown as Array<{ user_id: string }>) ?? [];
    for (const link of links) {
      portalUserIds.add(link.user_id);
    }
  }

  const emailById = new Map<string, string | null>();
  if (portalUserIds.size > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", [...portalUserIds]);
    for (const profile of profiles ?? []) {
      emailById.set(
        profile.id as string,
        (profile.email as string | null) ?? null
      );
    }
  }

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

    const portalLinks =
      (row.partner_portal_users as unknown as Array<{ user_id: string }>) ?? [];

    return {
      id: row.id as string,
      slug: row.slug as string,
      type: row.type as PartnerType,
      displayName: row.display_name as string,
      status: row.status as PartnerStatus,
      contactEmail: (row.contact_email as string | null) ?? null,
      defaultLandingPath: (row.default_landing_path as string) ?? "/signup",
      createdAt: row.created_at as string,
      payoutMinimumCents: (row.payout_minimum_cents as number) ?? 5000,
      payoutNetDays: (row.payout_net_days as number) ?? 30,
      taxFormStatus: (row.tax_form_status as string) ?? "none",
      portalUsers: portalLinks.map((link) => ({
        userId: link.user_id,
        email: emailById.get(link.user_id) ?? null,
      })),
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
  defaultLandingPath?: string;
  /** null = life of subscription; omit to use type template */
  durationMonths?: number | null;
  percentBps?: number | null;
  cpaCents?: number | null;
  clickWindowDays?: number;
  commissionBase?: CommissionBase;
  commissionType?: CommissionType;
  attributionModel?: "first_touch" | "last_touch";
  eligibleTiers?: string[];
  payoutMinimumCents?: number;
  payoutNetDays?: number;
  dealNotes?: string;
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
  const commissionType = input.commissionType ?? template.commissionType;
  const commissionBase = input.commissionBase ?? template.commissionBase;
  const attributionModel =
    input.attributionModel ?? template.attributionModel;
  const durationMonths =
    input.durationMonths === undefined
      ? template.durationMonths
      : input.durationMonths;
  const percentBps =
    input.percentBps === undefined
      ? template.percentBps
      : input.percentBps;
  const cpaCents =
    input.cpaCents === undefined ? template.cpaCents : input.cpaCents;
  const clickWindowDays = input.clickWindowDays ?? template.clickWindowDays;
  const eligibleTiers =
    input.eligibleTiers?.length
      ? input.eligibleTiers
      : ["pro", "pro_plus"];
  const payoutMinimumCents = input.payoutMinimumCents ?? 5000;
  const payoutNetDays = input.payoutNetDays ?? 30;
  const landing =
    input.defaultLandingPath?.trim().startsWith("/")
      ? input.defaultLandingPath.trim()
      : "/signup";

  if (commissionType === "percent" || commissionType === "hybrid") {
    if (percentBps == null || percentBps < 0 || percentBps > 10000) {
      return { ok: false, error: "Percent must be between 0% and 100%." };
    }
  }
  if (commissionType === "cpa" || commissionType === "hybrid") {
    if (cpaCents == null || cpaCents < 0) {
      return { ok: false, error: "CPA amount is required for CPA/hybrid deals." };
    }
  }
  if (clickWindowDays < 1 || clickWindowDays > 365) {
    return { ok: false, error: "Click window must be 1–365 days." };
  }
  if (payoutNetDays < 0 || payoutNetDays > 120) {
    return { ok: false, error: "Payout Net days must be 0–120." };
  }
  if (payoutMinimumCents < 0) {
    return { ok: false, error: "Payout minimum cannot be negative." };
  }

  const admin = createAdminClient();

  const { data: partner, error: partnerError } = await admin
    .from("partners")
    .insert({
      slug,
      type: input.type,
      display_name: displayName,
      status: "active",
      contact_email: input.contactEmail?.trim() || null,
      default_landing_path: landing,
      payout_minimum_cents: payoutMinimumCents,
      payout_net_days: payoutNetDays,
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
    commission_type: commissionType,
    commission_base: commissionBase,
    percent_bps: commissionType === "cpa" ? null : percentBps,
    cpa_cents: commissionType === "percent" ? null : cpaCents,
    duration_months: durationMonths,
    click_window_days: clickWindowDays,
    attribution_model: attributionModel,
    eligible_tiers: eligibleTiers,
    notes: input.dealNotes?.trim() || null,
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
      cpaCents,
      commissionBase,
      commissionType,
      attributionModel,
      eligibleTiers,
      payoutMinimumCents,
      payoutNetDays,
      code,
    },
  });

  return { ok: true, partnerId };
}

export async function deletePartner(input: {
  adminUserId: string;
  partnerId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const { data: partner, error: fetchError } = await admin
    .from("partners")
    .select("id, slug, display_name")
    .eq("id", input.partnerId)
    .maybeSingle();

  if (fetchError || !partner) {
    return { ok: false, error: fetchError?.message ?? "Partner not found." };
  }

  // Clear denormalized profile refs first
  await admin
    .from("profiles")
    .update({ acquisition_partner_id: null })
    .eq("acquisition_partner_id", input.partnerId);

  // Child tables with ON DELETE RESTRICT — remove before partner row
  const steps: Array<{ table: string; column: string }> = [
    { table: "partner_commissions", column: "partner_id" },
    { table: "partner_payouts", column: "partner_id" },
    { table: "user_attributions", column: "partner_id" },
    { table: "attribution_events", column: "partner_id" },
  ];

  for (const step of steps) {
    const { error } = await admin
      .from(step.table)
      .delete()
      .eq(step.column, input.partnerId);
    if (error) {
      return {
        ok: false,
        error: `Failed clearing ${step.table}: ${error.message}`,
      };
    }
  }

  // partner_deals, partner_codes, partner_portal_users cascade
  const { error: deleteError } = await admin
    .from("partners")
    .delete()
    .eq("id", input.partnerId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: "partner.delete",
    payload: {
      partnerId: input.partnerId,
      slug: partner.slug,
      displayName: partner.display_name,
    },
  });

  return { ok: true };
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
