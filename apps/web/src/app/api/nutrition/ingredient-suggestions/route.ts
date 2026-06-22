import { sendIngredientSuggestionEmail } from "@/lib/nutrition/ingredient-suggestion-email";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSuggestionSchema = z.object({
  searchQuery: z.string().trim().min(1).max(200),
  suggestedName: z.string().trim().min(1).max(200),
  categoryHint: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof createSuggestionSchema>;
  try {
    const json = await request.json();
    const parsed = createSuggestionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 }
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("nutrition_ingredient_suggestions")
    .insert({
      user_id: user.id,
      search_query: body.searchQuery,
      suggested_name: body.suggestedName,
      category_hint: body.categoryHint ?? null,
      notes: body.notes ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: error.message.includes("nutrition_ingredient_suggestions")
          ? "Apply the nutrition ingredient suggestions migration."
          : error.message,
      },
      { status: 500 }
    );
  }

  void sendIngredientSuggestionEmail({
    suggestionId: data.id,
    userId: user.id,
    userEmail: user.email,
    searchQuery: body.searchQuery,
    suggestedName: body.suggestedName,
    categoryHint: body.categoryHint,
    notes: body.notes,
  });

  return NextResponse.json({ ok: true, id: data.id });
}
