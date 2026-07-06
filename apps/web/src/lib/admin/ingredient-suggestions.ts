import { writeAdminAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export type IngredientSuggestionStatus =
  | "pending"
  | "reviewed"
  | "added"
  | "rejected";

export interface IngredientSuggestionRow {
  id: string;
  userId: string;
  userEmail: string | null;
  searchQuery: string;
  suggestedName: string;
  categoryHint: string | null;
  notes: string | null;
  status: IngredientSuggestionStatus;
  createdAt: string;
}

export async function listIngredientSuggestions(input?: {
  status?: IngredientSuggestionStatus | "all";
  limit?: number;
}): Promise<IngredientSuggestionRow[]> {
  const admin = createAdminClient();
  const limit = Math.min(Math.max(input?.limit ?? 100, 1), 500);
  const status = input?.status ?? "pending";

  let query = admin
    .from("nutrition_ingredient_suggestions")
    .select(
      "id, user_id, search_query, suggested_name, category_hint, notes, status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("ingredient suggestions list failed:", error.message);
    return [];
  }

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((row) => row.user_id as string))];
  const emailById = new Map<string, string | null>();

  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", userIds);

    for (const profile of profiles ?? []) {
      emailById.set(profile.id as string, (profile.email as string | null) ?? null);
    }
  }

  return rows.map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    userEmail: emailById.get(row.user_id as string) ?? null,
    searchQuery: row.search_query as string,
    suggestedName: row.suggested_name as string,
    categoryHint: (row.category_hint as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    status: row.status as IngredientSuggestionStatus,
    createdAt: row.created_at as string,
  }));
}

export async function updateIngredientSuggestionStatus(input: {
  adminUserId: string;
  suggestionId: string;
  status: IngredientSuggestionStatus;
  reason: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedReason = input.reason.trim();
  if (trimmedReason.length < 10) {
    return { ok: false, error: "Reason must be at least 10 characters." };
  }

  const admin = createAdminClient();
  const { data: existing, error: fetchError } = await admin
    .from("nutrition_ingredient_suggestions")
    .select("id, user_id, suggested_name, status")
    .eq("id", input.suggestionId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, error: "Suggestion not found." };
  }

  const { error: updateError } = await admin
    .from("nutrition_ingredient_suggestions")
    .update({ status: input.status })
    .eq("id", input.suggestionId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await writeAdminAuditLog({
    adminUserId: input.adminUserId,
    action: "ingredient_suggestion.update",
    targetUserId: existing.user_id as string,
    payload: {
      suggestionId: input.suggestionId,
      suggestedName: existing.suggested_name,
      previousStatus: existing.status,
      status: input.status,
      reason: trimmedReason,
    },
  });

  return { ok: true };
}
