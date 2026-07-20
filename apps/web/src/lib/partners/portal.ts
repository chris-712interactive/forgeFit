import "server-only";

import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import type { TaxFormStatus } from "@/lib/partners/commercial-policy";

export interface PartnerPortalContext {
  userId: string;
  email: string | undefined;
  partnerId: string;
  partnerSlug: string;
  partnerName: string;
  partnerType: string;
}

export async function getPartnerPortalContext(): Promise<PartnerPortalContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("partner_portal_users")
      .select(
        "partner_id, partners!inner(id, slug, display_name, type, status)"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) return null;

    const partner = data.partners as unknown as {
      id: string;
      slug: string;
      display_name: string;
      type: string;
      status: string;
    };

    if (partner.status === "terminated") return null;

    return {
      userId: user.id,
      email: user.email,
      partnerId: partner.id,
      partnerSlug: partner.slug,
      partnerName: partner.display_name,
      partnerType: partner.type,
    };
  } catch {
    return null;
  }
}

export async function requirePartnerPortalUser(): Promise<PartnerPortalContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/partner/login");
  }

  const ctx = await getPartnerPortalContext();
  if (!ctx) {
    notFound();
  }
  return ctx;
}

export interface PartnerPortalStats {
  periodMonth: string;
  clicks: number;
  signups: number;
  paidAccruals: number;
  estimatedCommissionCents: number;
  pendingCommissionCents: number;
  lifetimeCommissionCents: number;
  codes: string[];
  trackedLinkPath: string;
  clubBreakdown: Array<{ club: string; clicks: number; signups: number }>;
}

function currentPeriodMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getPartnerPortalStats(
  partnerId: string,
  partnerSlug: string,
  periodMonth = currentPeriodMonth()
): Promise<PartnerPortalStats> {
  const admin = createAdminClient();

  const monthStart = `${periodMonth}-01T00:00:00.000Z`;
  const [y, m] = periodMonth.split("-").map(Number);
  const nextMonth =
    m === 12
      ? `${y + 1}-01-01T00:00:00.000Z`
      : `${y}-${String(m + 1).padStart(2, "0")}-01T00:00:00.000Z`;

  const [
    { count: clicks },
    { data: attrs },
    { data: commissions },
    { data: lifetime },
    { data: codes },
    { data: clickEvents },
  ] = await Promise.all([
    admin
      .from("attribution_events")
      .select("id", { count: "exact", head: true })
      .eq("partner_id", partnerId)
      .gte("created_at", monthStart)
      .lt("created_at", nextMonth),
    admin
      .from("user_attributions")
      .select("id, metadata")
      .eq("partner_id", partnerId)
      .gte("attributed_at", monthStart)
      .lt("attributed_at", nextMonth),
    admin
      .from("partner_commissions")
      .select("entry_kind, commission_cents, status")
      .eq("partner_id", partnerId)
      .eq("period_month", periodMonth),
    admin
      .from("partner_commissions")
      .select("commission_cents")
      .eq("partner_id", partnerId),
    admin
      .from("partner_codes")
      .select("code")
      .eq("partner_id", partnerId)
      .eq("active", true),
    admin
      .from("attribution_events")
      .select("metadata")
      .eq("partner_id", partnerId)
      .gte("created_at", monthStart)
      .lt("created_at", nextMonth)
      .limit(2000),
  ]);

  let paidAccruals = 0;
  let estimatedCommissionCents = 0;
  let pendingCommissionCents = 0;
  for (const row of commissions ?? []) {
    estimatedCommissionCents += row.commission_cents as number;
    if (row.entry_kind === "accrual") paidAccruals += 1;
    if (row.status === "pending" || row.status === "payable") {
      pendingCommissionCents += row.commission_cents as number;
    }
  }

  const lifetimeCommissionCents = (lifetime ?? []).reduce(
    (sum, row) => sum + (row.commission_cents as number),
    0
  );

  const clubClicks = new Map<string, number>();
  for (const event of clickEvents ?? []) {
    const meta = event.metadata as { club?: string | null } | null;
    const club = meta?.club?.trim();
    if (club) {
      clubClicks.set(club, (clubClicks.get(club) ?? 0) + 1);
    }
  }

  const clubSignups = new Map<string, number>();
  for (const attr of attrs ?? []) {
    const meta = attr.metadata as { club?: string | null } | null;
    const club = meta?.club?.trim();
    if (club) {
      clubSignups.set(club, (clubSignups.get(club) ?? 0) + 1);
    }
  }

  const clubKeys = new Set([...clubClicks.keys(), ...clubSignups.keys()]);
  const clubBreakdown = [...clubKeys]
    .map((club) => ({
      club,
      clicks: clubClicks.get(club) ?? 0,
      signups: clubSignups.get(club) ?? 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 25);

  return {
    periodMonth,
    clicks: clicks ?? 0,
    signups: attrs?.length ?? 0,
    paidAccruals,
    estimatedCommissionCents,
    pendingCommissionCents,
    lifetimeCommissionCents,
    codes: (codes ?? []).map((row) => row.code as string),
    trackedLinkPath: `/r/${partnerSlug}`,
    clubBreakdown,
  };
}

export async function grantPartnerPortalAccess(input: {
  adminUserId: string;
  partnerId: string;
  email: string;
}): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, error: "Valid email is required." };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email")
    .ilike("email", email)
    .maybeSingle();

  if (!profile) {
    return {
      ok: false,
      error: "No ForgeRep account with that email. Ask them to sign up first.",
    };
  }

  const { error } = await admin.from("partner_portal_users").insert({
    partner_id: input.partnerId,
    user_id: profile.id,
    created_by: input.adminUserId,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "That user is already linked to a partner portal.",
      };
    }
    return { ok: false, error: error.message };
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: "partner.portal_grant",
    targetUserId: profile.id as string,
    payload: { partnerId: input.partnerId, email },
  });

  return { ok: true, userId: profile.id as string };
}

export async function revokePartnerPortalAccess(input: {
  adminUserId: string;
  partnerId: string;
  userId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("partner_portal_users")
    .delete()
    .eq("partner_id", input.partnerId)
    .eq("user_id", input.userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: "partner.portal_revoke",
    targetUserId: input.userId,
    payload: { partnerId: input.partnerId },
  });

  return { ok: true };
}

export async function updatePartnerTaxForm(input: {
  adminUserId: string;
  partnerId: string;
  taxFormStatus: TaxFormStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const payload: Record<string, unknown> = {
    tax_form_status: input.taxFormStatus,
    updated_at: new Date().toISOString(),
  };
  if (input.taxFormStatus === "received" || input.taxFormStatus === "verified") {
    payload.tax_form_received_at = new Date().toISOString();
  } else {
    payload.tax_form_received_at = null;
  }

  const { error } = await admin
    .from("partners")
    .update(payload)
    .eq("id", input.partnerId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: "partner.tax_form",
    payload: {
      partnerId: input.partnerId,
      taxFormStatus: input.taxFormStatus,
    },
  });

  return { ok: true };
}

export async function listPortalUsersForPartner(
  partnerId: string
): Promise<Array<{ userId: string; email: string | null }>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("partner_portal_users")
    .select("user_id, profiles(email)")
    .eq("partner_id", partnerId);

  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { email: string | null } | null;
    return {
      userId: row.user_id as string,
      email: profile?.email ?? null,
    };
  });
}
