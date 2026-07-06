import { NextResponse } from "next/server";
import { setUserAdminFeatureFlags } from "@/lib/admin/feature-flags";
import { getAdminApiActor } from "@/lib/admin/auth";
import {
  adminRateLimitResponse,
  checkAdminRateLimit,
} from "@/lib/admin/rate-limit";

interface FeatureFlagsBody {
  flags?: Record<string, boolean>;
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
  let body: FeatureFlagsBody;

  try {
    body = (await request.json()) as FeatureFlagsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = await setUserAdminFeatureFlags({
    adminUserId: actor.userId,
    targetUserId,
    flags: body.flags ?? {},
    reason: body.reason ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
