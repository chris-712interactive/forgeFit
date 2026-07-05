import { NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/admin/audit";
import { getAdminApiActor } from "@/lib/admin/auth";
import {
  clearImpersonationCookie,
  getImpersonationFromRequestCookies,
} from "@/lib/admin/impersonation";

export async function DELETE() {
  const actor = await getAdminApiActor();
  if (!actor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const active = await getImpersonationFromRequestCookies(actor.userId);

  await clearImpersonationCookie();

  if (active) {
    await writeAdminAuditLog({
      adminUserId: actor.userId,
      action: "impersonation_end",
      targetUserId: active.targetUserId,
    });
  }

  return NextResponse.json({
    ok: true,
    redirect: active ? `/admin/users/${active.targetUserId}` : "/admin",
  });
}
