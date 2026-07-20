import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { PartnerRefCookie } from "./cookie";
import { isSelfReferralEmail } from "./commercial-policy";
import {
  getActiveDealForPartner,
  getActivePartnerBySlug,
  getActivePartnerCode,
} from "./resolve";
import type { AttributionSource } from "./types";

export interface RecordClickInput {
  partnerId: string;
  partnerCodeId?: string | null;
  visitorId: string;
  source: AttributionSource;
  landingUrl?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  metadata?: Record<string, unknown>;
}

export async function recordAttributionClick(
  input: RecordClickInput
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("attribution_events")
    .insert({
      partner_id: input.partnerId,
      partner_code_id: input.partnerCodeId ?? null,
      visitor_id: input.visitorId,
      source: input.source,
      landing_url: input.landingUrl ?? null,
      referrer: input.referrer ?? null,
      utm_source: input.utmSource ?? null,
      utm_medium: input.utmMedium ?? null,
      utm_campaign: input.utmCampaign ?? null,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[partners] attribution click insert failed:", error.message);
    return null;
  }

  return (data?.id as string | undefined) ?? null;
}

export interface StampAttributionResult {
  stamped: boolean;
  reason?: string;
  partnerId?: string;
  attributionId?: string;
}

/**
 * First durable touch: if the user has no user_attributions row and the
 * partner cookie (or code) is still within the deal click window, stamp them.
 */
export async function stampUserAttributionFromRef(input: {
  userId: string;
  ref: PartnerRefCookie | null;
  /** Optional explicit code (e.g. checkout / signup form). */
  code?: string | null;
}): Promise<StampAttributionResult> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("user_attributions")
    .select("id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing) {
    return { stamped: false, reason: "already_attributed" };
  }

  let partnerId: string | null = null;
  let partnerCodeId: string | null = null;
  let source: AttributionSource = "link";
  let metadata: Record<string, unknown> = {};

  if (input.code?.trim()) {
    const coded = await getActivePartnerCode(input.code);
    if (coded) {
      partnerId = coded.partner.id;
      partnerCodeId = coded.id;
      source = "code";
    }
  }

  if (!partnerId && input.ref) {
    const partner = await getActivePartnerBySlug(input.ref.slug);
    if (partner) {
      partnerId = partner.id;
      source = input.ref.code ? "code" : "link";
      metadata = {
        club: input.ref.club ?? null,
        campaign: input.ref.campaign ?? null,
        visitorId: input.ref.visitorId,
        clickedAt: input.ref.clickedAt,
      };

      if (input.ref.code) {
        const coded = await getActivePartnerCode(input.ref.code);
        if (coded && coded.partnerId === partner.id) {
          partnerCodeId = coded.id;
        }
      }
    }
  }

  if (!partnerId) {
    return { stamped: false, reason: "no_partner" };
  }

  const { data: partnerRow } = await admin
    .from("partners")
    .select("id, contact_email, status")
    .eq("id", partnerId)
    .maybeSingle();

  if (!partnerRow || partnerRow.status !== "active") {
    return { stamped: false, reason: "partner_inactive" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", input.userId)
    .maybeSingle();

  if (
    isSelfReferralEmail({
      memberEmail: profile?.email as string | null,
      partnerContactEmail: partnerRow.contact_email as string | null,
    })
  ) {
    return { stamped: false, reason: "self_referral" };
  }

  const { data: portalLink } = await admin
    .from("partner_portal_users")
    .select("id")
    .eq("partner_id", partnerId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (portalLink) {
    return { stamped: false, reason: "portal_user_self_referral" };
  }

  const deal = await getActiveDealForPartner(partnerId);
  if (!deal) {
    return { stamped: false, reason: "no_active_deal" };
  }

  const clickedAt = input.ref?.clickedAt
    ? new Date(input.ref.clickedAt)
    : new Date();
  const clickExpires = new Date(clickedAt);
  clickExpires.setUTCDate(clickExpires.getUTCDate() + deal.clickWindowDays);

  if (Date.now() > clickExpires.getTime() && source !== "code") {
    // Explicit code at signup/checkout can still attribute within a fresh window
    // from "now" — only cookie-based link attribution expires.
    return { stamped: false, reason: "click_window_expired" };
  }

  const attributedAt = new Date();
  const clickExpiresAt =
    source === "code" && !input.ref
      ? new Date(
          attributedAt.getTime() + deal.clickWindowDays * 24 * 60 * 60 * 1000
        )
      : clickExpires;

  const { data: attribution, error } = await admin
    .from("user_attributions")
    .insert({
      user_id: input.userId,
      partner_id: partnerId,
      partner_code_id: partnerCodeId,
      deal_id: deal.id,
      attribution_model: deal.attributionModel,
      source,
      attributed_at: attributedAt.toISOString(),
      click_expires_at: clickExpiresAt.toISOString(),
      metadata,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    // Unique violation = race; treat as already attributed
    if (error.code === "23505") {
      return { stamped: false, reason: "already_attributed" };
    }
    console.error("[partners] user_attributions insert failed:", error.message);
    return { stamped: false, reason: "insert_failed" };
  }

  await admin
    .from("profiles")
    .update({ acquisition_partner_id: partnerId })
    .eq("id", input.userId);

  if (input.ref?.visitorId) {
    await admin
      .from("attribution_events")
      .update({ user_id: input.userId })
      .eq("visitor_id", input.ref.visitorId)
      .is("user_id", null);
  }

  return {
    stamped: true,
    partnerId,
    attributionId: attribution?.id as string | undefined,
  };
}

export async function getUserAttribution(userId: string): Promise<{
  id: string;
  partnerId: string;
  partnerSlug: string | null;
} | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_attributions")
    .select("id, partner_id, partners(slug)")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const partners = data.partners as unknown as { slug?: string } | null;

  return {
    id: data.id as string,
    partnerId: data.partner_id as string,
    partnerSlug: partners?.slug ?? null,
  };
}
