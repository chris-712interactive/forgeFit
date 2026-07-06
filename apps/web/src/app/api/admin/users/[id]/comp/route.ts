import { NextResponse } from "next/server";
import { getAdminApiActor } from "@/lib/admin/auth";
import { grantCompUpgrade, revokeCompAccess } from "@/lib/admin/comp";
import {
  adminRateLimitResponse,
  checkAdminRateLimit,
} from "@/lib/admin/rate-limit";
import type { PaidTier } from "@/lib/billing/types";

interface CompRequestBody {
  action?: "grant" | "revoke";
  tier?: PaidTier;
  expiresAt?: string;
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
  let body: CompRequestBody;

  try {
    body = (await request.json()) as CompRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action === "revoke") {
    const result = await revokeCompAccess({
      adminUserId: actor.userId,
      targetUserId,
      reason: body.reason ?? "",
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action !== "grant") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  if (body.tier !== "pro" && body.tier !== "pro_plus") {
    return NextResponse.json({ error: "Tier must be pro or pro_plus." }, { status: 400 });
  }

  if (!body.expiresAt) {
    return NextResponse.json({ error: "expiresAt is required." }, { status: 400 });
  }

  const result = await grantCompUpgrade({
    adminUserId: actor.userId,
    targetUserId,
    tier: body.tier,
    expiresAt: body.expiresAt,
    reason: body.reason ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
