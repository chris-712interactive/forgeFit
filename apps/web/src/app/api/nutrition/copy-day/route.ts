import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const copyDaySchema = z.object({
  sourceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof copyDaySchema>;
  try {
    const json = await request.json();
    const parsed = copyDaySchema.safeParse(json);
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

  const { data: sourceRows, error: fetchError } = await supabase
    .from("nutrition_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("logged_date", body.sourceDate)
    .order("created_at", { ascending: true });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!sourceRows?.length) {
    return NextResponse.json(
      { error: "No entries to copy for that day." },
      { status: 404 }
    );
  }

  const now = new Date().toISOString();
  const inserts = sourceRows.map((row) => ({
    user_id: user.id,
    client_id: crypto.randomUUID(),
    logged_date: body.targetDate,
    meal_type: row.meal_type,
    food_name: row.food_name,
    food_source: row.food_source,
    external_food_id: row.external_food_id,
    brand: row.brand,
    serving_description: row.serving_description,
    quantity: row.quantity,
    serving_grams: row.serving_grams,
    calories: row.calories,
    protein_g: row.protein_g,
    fat_g: row.fat_g,
    carbs_g: row.carbs_g,
    line_items: row.line_items,
    servings_logged: row.servings_logged,
    updated_at: now,
  }));

  const { error: insertError } = await supabase
    .from("nutrition_logs")
    .insert(inserts);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ copied: inserts.length });
}
