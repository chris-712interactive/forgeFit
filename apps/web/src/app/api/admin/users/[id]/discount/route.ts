import { NextResponse } from "next/server";
import { getAdminApiActor } from "@/lib/admin/auth";
import {
  applyAdminUserDiscount,
  removeAdminUserDiscount,
} from "@/lib/admin/discount";
import {
  adminRateLimitResponse,
  checkAdminRateLimit,
} from "@/lib/admin/rate-limit";

interface DiscountRequestBody {
  couponId?: string;
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
  let body: DiscountRequestBody;

  try {
    body = (await request.json()) as DiscountRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.couponId?.trim()) {
    return NextResponse.json({ error: "couponId is required." }, { status: 400 });
  }

  const result = await applyAdminUserDiscount({
    adminUserId: actor.userId,
    targetUserId,
    couponId: body.couponId,
    reason: body.reason ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
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
  let body: DiscountRequestBody;

  try {
    body = (await request.json()) as DiscountRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await removeAdminUserDiscount({
    adminUserId: actor.userId,
    targetUserId,
    reason: body.reason ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
