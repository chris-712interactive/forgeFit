import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminAuditEntry {
  id: string;
  adminUserId: string;
  adminEmail: string | null;
  action: string;
  targetUserId: string | null;
  targetEmail: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export async function writeAdminAuditLog(input: {
  adminUserId: string;
  action: string;
  targetUserId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("admin_audit_log").insert({
    admin_user_id: input.adminUserId,
    action: input.action,
    target_user_id: input.targetUserId ?? null,
    payload: input.payload ?? {},
  });

  if (error) {
    console.error("admin audit log insert failed:", error.message);
  }
}

export async function listAdminAuditLog(limit = 50): Promise<AdminAuditEntry[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_audit_log")
    .select("id, admin_user_id, action, target_user_id, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("admin audit log list failed:", error.message);
    return [];
  }

  const rows = data ?? [];
  const userIds = new Set<string>();
  for (const row of rows) {
    userIds.add(row.admin_user_id as string);
    if (row.target_user_id) {
      userIds.add(row.target_user_id as string);
    }
  }

  const emailById = new Map<string, string | null>();
  if (userIds.size > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", [...userIds]);

    for (const profile of profiles ?? []) {
      emailById.set(profile.id as string, (profile.email as string | null) ?? null);
    }
  }

  return rows.map((row) => ({
    id: row.id as string,
    adminUserId: row.admin_user_id as string,
    adminEmail: emailById.get(row.admin_user_id as string) ?? null,
    action: row.action as string,
    targetUserId: (row.target_user_id as string | null) ?? null,
    targetEmail: row.target_user_id
      ? (emailById.get(row.target_user_id as string) ?? null)
      : null,
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
  }));
}
