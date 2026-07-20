import "server-only";

import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import type { TaxFormStatus } from "@/lib/partners/commercial-policy";

export type {
  MonthTrendPoint,
  NamedCount,
  PartnerPortalStats,
} from "./portal-stats";
export { getPartnerPortalStats } from "./portal-stats";

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
