import { verifyCronSecret } from "@/lib/integrations/fitbit-sync-scheduler";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 }
    );
  }

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "pending";
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? 100), 1),
    500
  );

  const query = admin
    .from("nutrition_ingredient_suggestions")
    .select(
      "id, user_id, search_query, suggested_name, category_hint, notes, status, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data, error } =
    status === "all" ? await query : await query.eq("status", status);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const suggestions = data ?? [];
  const byName = new Map<string, number>();
  for (const row of suggestions) {
    const key = row.suggested_name.trim().toLowerCase();
    byName.set(key, (byName.get(key) ?? 0) + 1);
  }

  const topSuggested = [...byName.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({ name, count }));

  return NextResponse.json({
    ok: true,
    count: suggestions.length,
    topSuggested,
    suggestions,
  });
}
