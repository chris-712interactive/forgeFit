import { NextResponse } from "next/server";
import {
  adminCancelUserSubscription,
  adminRefundLatestSubscriptionPayment,
} from "@/lib/admin/billing-actions";
import { getAdminApiActor } from "@/lib/admin/auth";
import {
  adminRateLimitResponse,
  checkAdminRateLimit,
} from "@/lib/admin/rate-limit";

interface BillingBody {
  action?: "cancel_period_end" | "cancel_immediate" | "refund_latest";
  reason?: string;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await getAdminApiActor();
  if (!actor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!checkAdminRateLimit(actor.userId)) {
    return adminRateLimitResponse();
  }

  const { id: targetUserId } = await context.params;
  let body: BillingBody;

  try {
    body = (await request.json()) as BillingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action === "refund_latest") {
    const result = await adminRefundLatestSubscriptionPayment({
      adminUserId: actor.userId,
      targetUserId,
      reason: body.reason ?? "",
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, refundId: result.refundId });
  }

  if (
    body.action === "cancel_period_end" ||
    body.action === "cancel_immediate"
  ) {
    const result = await adminCancelUserSubscription({
      adminUserId: actor.userId,
      targetUserId,
      immediate: body.action === "cancel_immediate",
      reason: body.reason ?? "",
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
