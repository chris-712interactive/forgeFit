import {
  commissionLedgerToCsv,
  listCommissionLedger,
  partnerMonthSummaryToCsv,
  summarizePartnerMonth,
} from "@/lib/admin/partner-ledger";
import { getAdminApiActor } from "@/lib/admin/auth";
import {
  adminRateLimitResponse,
  checkAdminRateLimit,
} from "@/lib/admin/rate-limit";

function currentPeriodMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const actor = await getAdminApiActor();
  if (!actor) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!checkAdminRateLimit(actor.userId, { limit: 30, windowMs: 60_000 })) {
    return adminRateLimitResponse();
  }

  const url = new URL(request.url);
  const partnerId = url.searchParams.get("partnerId") ?? undefined;
  const periodMonth =
    url.searchParams.get("periodMonth") ?? currentPeriodMonth();
  const detail = url.searchParams.get("detail") === "1";

  const date = new Date().toISOString().slice(0, 10);

  if (detail) {
    const rows = await listCommissionLedger({
      partnerId,
      periodMonth,
      limit: 2000,
    });
    const csv = commissionLedgerToCsv(rows);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="forgerep-partner-ledger-${periodMonth}-${date}.csv"`,
      },
    });
  }

  const summary = await summarizePartnerMonth(periodMonth, partnerId);
  const csv = partnerMonthSummaryToCsv(summary);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="forgerep-partner-summary-${periodMonth}-${date}.csv"`,
    },
  });
}
