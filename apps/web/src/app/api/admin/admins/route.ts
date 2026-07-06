import { NextResponse } from "next/server";
import {
  findUserByEmailForAdminGrant,
  listAdminOperators,
  setAdminOperatorFlag,
} from "@/lib/admin/admins";
import { getAdminApiActor } from "@/lib/admin/auth";
import {
  adminRateLimitResponse,
  checkAdminRateLimit,
} from "@/lib/admin/rate-limit";

interface AdminBody {
  action?: "grant" | "revoke" | "lookup";
  targetUserId?: string;
  email?: string;
  reason?: string;
}

export async function GET() {
  const actor = await getAdminApiActor();
  if (!actor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const admins = await listAdminOperators();
  return NextResponse.json({ admins });
}

export async function POST(request: Request) {
  const actor = await getAdminApiActor();
  if (!actor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!checkAdminRateLimit(actor.userId)) {
    return adminRateLimitResponse();
  }

  let body: AdminBody;
  try {
    body = (await request.json()) as AdminBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action === "lookup") {
    if (!body.email?.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    const user = await findUserByEmailForAdminGrant(body.email);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ user });
  }

  if (body.action !== "grant" && body.action !== "revoke") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  if (!body.targetUserId) {
    return NextResponse.json({ error: "targetUserId is required." }, { status: 400 });
  }

  const result = await setAdminOperatorFlag({
    adminUserId: actor.userId,
    targetUserId: body.targetUserId,
    isAdmin: body.action === "grant",
    reason: body.reason ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
