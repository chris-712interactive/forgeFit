import { NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { getAdminApiActor } from "@/lib/admin/auth";
import { setImpersonationCookie } from "@/lib/admin/impersonation";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const actor = await getAdminApiActor();
  if (!actor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { id: targetUserId } = await context.params;
  const admin = createAdminClient();
  const { data: target, error } = await admin
    .from("profiles")
    .select("id, email, is_admin")
    .eq("id", targetUserId)
    .maybeSingle();

  if (error || !target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.is_admin) {
    return NextResponse.json(
      { error: "Cannot impersonate another admin account." },
      { status: 400 }
    );
  }

  await setImpersonationCookie(actor.userId, targetUserId);

  await writeAdminAuditLog({
    adminUserId: actor.userId,
    action: "impersonation_start",
    targetUserId,
    payload: {
      targetEmail: target.email,
    },
  });

  return NextResponse.json({
    ok: true,
    redirect: "/home",
    targetEmail: target.email,
  });
}
