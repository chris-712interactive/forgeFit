import { writeAdminAuditLog } from "@/lib/admin/audit";
import { isAdminUser } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminOperatorRow {
  id: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
  createdAt: string;
}

export async function listAdminOperators(): Promise<AdminOperatorRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, display_name, is_admin, created_at")
    .eq("is_admin", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("list admins failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    email: (row.email as string | null) ?? null,
    displayName: (row.display_name as string | null) ?? null,
    isAdmin: Boolean(row.is_admin),
    createdAt: row.created_at as string,
  }));
}

export async function findUserByEmailForAdminGrant(
  email: string
): Promise<AdminOperatorRow | null> {
  const admin = createAdminClient();
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return null;

  const { data, error } = await admin
    .from("profiles")
    .select("id, email, display_name, is_admin, created_at")
    .ilike("email", trimmed)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id as string,
    email: (data.email as string | null) ?? null,
    displayName: (data.display_name as string | null) ?? null,
    isAdmin: Boolean(data.is_admin),
    createdAt: data.created_at as string,
  };
}

export async function setAdminOperatorFlag(input: {
  adminUserId: string;
  targetUserId: string;
  isAdmin: boolean;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedReason = input.reason.trim();
  if (trimmedReason.length < 10) {
    return { ok: false, error: "Reason must be at least 10 characters." };
  }

  if (input.adminUserId === input.targetUserId && !input.isAdmin) {
    return { ok: false, error: "You cannot revoke your own admin access." };
  }

  const admin = createAdminClient();
  const { data: target, error: fetchError } = await admin
    .from("profiles")
    .select("id, email, is_admin")
    .eq("id", input.targetUserId)
    .maybeSingle();

  if (fetchError || !target) {
    return { ok: false, error: "User not found." };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ is_admin: input.isAdmin })
    .eq("id", input.targetUserId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: input.isAdmin ? "admin.grant" : "admin.revoke",
    targetUserId: input.targetUserId,
    payload: {
      reason: trimmedReason,
      targetEmail: target.email,
      previousIsAdmin: target.is_admin,
    },
  });

  return { ok: true };
}

export function isEnvSeededAdmin(userId: string): boolean {
  return isAdminUser({ userId, profileFlag: false });
}
