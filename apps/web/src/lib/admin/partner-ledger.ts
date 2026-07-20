import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/audit";

export interface CommissionLedgerRow {
  id: string;
  partnerId: string;
  partnerSlug: string;
  partnerName: string;
  userId: string;
  userEmail: string | null;
  entryKind: "accrual" | "reversal";
  periodMonth: string;
  grossCents: number;
  feeCents: number;
  taxCents: number;
  baseCents: number;
  commissionCents: number;
  status: string;
  tier: string | null;
  stripeInvoiceId: string | null;
  createdAt: string;
}

export async function listCommissionLedger(input?: {
  partnerId?: string;
  periodMonth?: string;
  status?: string;
  limit?: number;
}): Promise<CommissionLedgerRow[]> {
  const admin = createAdminClient();
  let query = admin
    .from("partner_commissions")
    .select(
      "id, partner_id, user_id, entry_kind, period_month, gross_cents, fee_cents, tax_cents, base_cents, commission_cents, status, tier, stripe_invoice_id, created_at, partners(slug, display_name)"
    )
    .order("created_at", { ascending: false })
    .limit(input?.limit ?? 200);

  if (input?.partnerId) {
    query = query.eq("partner_id", input.partnerId);
  }
  if (input?.periodMonth) {
    query = query.eq("period_month", input.periodMonth);
  }
  if (input?.status) {
    query = query.eq("status", input.status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[partners] ledger list failed:", error.message);
    return [];
  }

  const userIds = [
    ...new Set((data ?? []).map((row) => row.user_id as string)),
  ];
  const emailById = new Map<string, string | null>();
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", userIds);
    for (const profile of profiles ?? []) {
      emailById.set(
        profile.id as string,
        (profile.email as string | null) ?? null
      );
    }
  }

  return (data ?? []).map((row) => {
    const partner = row.partners as unknown as {
      slug: string;
      display_name: string;
    } | null;
    return {
      id: row.id as string,
      partnerId: row.partner_id as string,
      partnerSlug: partner?.slug ?? "",
      partnerName: partner?.display_name ?? "",
      userId: row.user_id as string,
      userEmail: emailById.get(row.user_id as string) ?? null,
      entryKind: row.entry_kind as "accrual" | "reversal",
      periodMonth: row.period_month as string,
      grossCents: row.gross_cents as number,
      feeCents: row.fee_cents as number,
      taxCents: row.tax_cents as number,
      baseCents: row.base_cents as number,
      commissionCents: row.commission_cents as number,
      status: row.status as string,
      tier: (row.tier as string | null) ?? null,
      stripeInvoiceId: (row.stripe_invoice_id as string | null) ?? null,
      createdAt: row.created_at as string,
    };
  });
}

export interface PartnerMonthSummary {
  partnerId: string;
  partnerSlug: string;
  partnerName: string;
  periodMonth: string;
  accrualCount: number;
  reversalCount: number;
  grossCents: number;
  commissionCents: number;
  pendingCents: number;
  attributedSignups: number;
}

export async function summarizePartnerMonth(
  periodMonth: string,
  partnerId?: string
): Promise<PartnerMonthSummary[]> {
  const admin = createAdminClient();

  let commissionQuery = admin
    .from("partner_commissions")
    .select(
      "partner_id, entry_kind, gross_cents, commission_cents, status, partners(slug, display_name)"
    )
    .eq("period_month", periodMonth);

  if (partnerId) {
    commissionQuery = commissionQuery.eq("partner_id", partnerId);
  }

  const { data: commissions, error } = await commissionQuery;
  if (error) {
    console.error("[partners] month summary failed:", error.message);
    return [];
  }

  const byPartner = new Map<string, PartnerMonthSummary>();

  for (const row of commissions ?? []) {
    const pid = row.partner_id as string;
    const partner = row.partners as unknown as {
      slug: string;
      display_name: string;
    } | null;
    const current = byPartner.get(pid) ?? {
      partnerId: pid,
      partnerSlug: partner?.slug ?? "",
      partnerName: partner?.display_name ?? "",
      periodMonth,
      accrualCount: 0,
      reversalCount: 0,
      grossCents: 0,
      commissionCents: 0,
      pendingCents: 0,
      attributedSignups: 0,
    };

    if (row.entry_kind === "accrual") {
      current.accrualCount += 1;
    } else {
      current.reversalCount += 1;
    }
    current.grossCents += row.gross_cents as number;
    current.commissionCents += row.commission_cents as number;
    if (row.status === "pending" || row.status === "payable") {
      current.pendingCents += row.commission_cents as number;
    }
    byPartner.set(pid, current);
  }

  // Attributed signups in month (user_attributions.attributed_at)
  const monthStart = `${periodMonth}-01T00:00:00.000Z`;
  const [y, m] = periodMonth.split("-").map(Number);
  const nextMonth =
    m === 12
      ? `${y + 1}-01-01T00:00:00.000Z`
      : `${y}-${String(m + 1).padStart(2, "0")}-01T00:00:00.000Z`;

  let attrQuery = admin
    .from("user_attributions")
    .select("partner_id")
    .gte("attributed_at", monthStart)
    .lt("attributed_at", nextMonth);

  if (partnerId) {
    attrQuery = attrQuery.eq("partner_id", partnerId);
  }

  const { data: attrs } = await attrQuery;
  const signupCounts = new Map<string, number>();
  for (const row of attrs ?? []) {
    const pid = row.partner_id as string;
    signupCounts.set(pid, (signupCounts.get(pid) ?? 0) + 1);
  }

  // Include partners with signups but no commissions yet
  for (const [pid, count] of signupCounts) {
    const existing = byPartner.get(pid);
    if (existing) {
      existing.attributedSignups = count;
    } else if (!partnerId || partnerId === pid) {
      const { data: partner } = await admin
        .from("partners")
        .select("slug, display_name")
        .eq("id", pid)
        .maybeSingle();
      byPartner.set(pid, {
        partnerId: pid,
        partnerSlug: (partner?.slug as string) ?? "",
        partnerName: (partner?.display_name as string) ?? "",
        periodMonth,
        accrualCount: 0,
        reversalCount: 0,
        grossCents: 0,
        commissionCents: 0,
        pendingCents: 0,
        attributedSignups: count,
      });
    }
  }

  return [...byPartner.values()].sort((a, b) =>
    a.partnerSlug.localeCompare(b.partnerSlug)
  );
}

export async function markPartnerPayoutPaid(input: {
  adminUserId: string;
  partnerId: string;
  periodMonth: string;
  externalReference?: string;
  notes?: string;
}): Promise<
  | { ok: true; payoutId: string; amountCents: number; commissionCount: number }
  | { ok: false; error: string }
> {
  if (!/^\d{4}-\d{2}$/.test(input.periodMonth)) {
    return { ok: false, error: "periodMonth must be YYYY-MM." };
  }

  const admin = createAdminClient();

  const { data: pending, error: fetchError } = await admin
    .from("partner_commissions")
    .select("id, commission_cents")
    .eq("partner_id", input.partnerId)
    .eq("period_month", input.periodMonth)
    .in("status", ["pending", "payable"]);

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  if (!pending?.length) {
    return { ok: false, error: "No pending commissions for that partner/month." };
  }

  const amountCents = pending.reduce(
    (sum, row) => sum + (row.commission_cents as number),
    0
  );

  const { data: payout, error: payoutError } = await admin
    .from("partner_payouts")
    .insert({
      partner_id: input.partnerId,
      period_month: input.periodMonth,
      amount_cents: amountCents,
      status: "paid",
      paid_at: new Date().toISOString(),
      external_reference: input.externalReference?.trim() || null,
      notes: input.notes?.trim() || null,
      created_by: input.adminUserId,
    })
    .select("id")
    .maybeSingle();

  if (payoutError || !payout) {
    return { ok: false, error: payoutError?.message ?? "Payout insert failed." };
  }

  const ids = pending.map((row) => row.id as string);
  const { error: updateError } = await admin
    .from("partner_commissions")
    .update({ status: "paid", payout_id: payout.id })
    .in("id", ids);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: "partner.payout",
    payload: {
      payoutId: payout.id,
      partnerId: input.partnerId,
      periodMonth: input.periodMonth,
      amountCents,
      commissionCount: ids.length,
    },
  });

  return {
    ok: true,
    payoutId: payout.id as string,
    amountCents,
    commissionCount: ids.length,
  };
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function partnerMonthSummaryToCsv(
  rows: PartnerMonthSummary[]
): string {
  const header =
    "partner_slug,partner_name,period_month,attributed_signups,paid_accruals,reversals,gross_cents,commission_cents,pending_cents";
  const lines = rows.map((row) =>
    [
      csvEscape(row.partnerSlug),
      csvEscape(row.partnerName),
      csvEscape(row.periodMonth),
      String(row.attributedSignups),
      String(row.accrualCount),
      String(row.reversalCount),
      String(row.grossCents),
      String(row.commissionCents),
      String(row.pendingCents),
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

export function commissionLedgerToCsv(rows: CommissionLedgerRow[]): string {
  const header =
    "created_at,period_month,partner_slug,partner_name,user_email,entry_kind,status,tier,gross_cents,fee_cents,tax_cents,base_cents,commission_cents,stripe_invoice_id";
  const lines = rows.map((row) =>
    [
      csvEscape(row.createdAt),
      csvEscape(row.periodMonth),
      csvEscape(row.partnerSlug),
      csvEscape(row.partnerName),
      csvEscape(row.userEmail ?? ""),
      csvEscape(row.entryKind),
      csvEscape(row.status),
      csvEscape(row.tier ?? ""),
      String(row.grossCents),
      String(row.feeCents),
      String(row.taxCents),
      String(row.baseCents),
      String(row.commissionCents),
      csvEscape(row.stripeInvoiceId ?? ""),
    ].join(",")
  );
  return [header, ...lines].join("\n");
}
