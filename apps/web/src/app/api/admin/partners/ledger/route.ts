import { NextResponse } from "next/server";
import {
  listCommissionLedger,
  markPartnerPayoutPaid,
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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const partnerId = url.searchParams.get("partnerId") ?? undefined;
  const periodMonth =
    url.searchParams.get("periodMonth") ?? currentPeriodMonth();
  const status = url.searchParams.get("status") ?? undefined;

  const [ledger, summary] = await Promise.all([
    listCommissionLedger({ partnerId, periodMonth, status }),
    summarizePartnerMonth(periodMonth, partnerId),
  ]);

  return NextResponse.json({ periodMonth, ledger, summary });
}

export async function POST(request: Request) {
  const actor = await getAdminApiActor();
  if (!actor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!checkAdminRateLimit(actor.userId)) {
    return adminRateLimitResponse();
  }

  let body: {
    action?: string;
    partnerId?: string;
    periodMonth?: string;
    externalReference?: string;
    notes?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action !== "mark_payout_paid") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  if (!body.partnerId || !body.periodMonth) {
    return NextResponse.json(
      { error: "partnerId and periodMonth are required." },
      { status: 400 }
    );
  }

  const result = await markPartnerPayoutPaid({
    adminUserId: actor.userId,
    partnerId: body.partnerId,
    periodMonth: body.periodMonth,
    externalReference: body.externalReference,
    notes: body.notes,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
