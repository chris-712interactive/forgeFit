import { todayIsoDate } from "@/lib/nutrition/service";
import { parseMfpDiaryCsv } from "@/lib/nutrition/mfp-csv-parser";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a CSV file to import." }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File is too large. Export a smaller date range from MyFitnessPal." },
      { status: 400 }
    );
  }

  const csvText = await file.text();
  const todayIso = await todayIsoDate();
  const parsed = parseMfpDiaryCsv(csvText, { todayIso });

  if (parsed.errors.length > 0 && parsed.rows.length === 0) {
    return NextResponse.json(
      { error: parsed.errors.join(" "), errors: parsed.errors },
      { status: 400 }
    );
  }

  if (parsed.rows.length === 0) {
    return NextResponse.json(
      { error: "No entries to import.", skipped: parsed.skipped },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const inserts = parsed.rows.map((row) => ({
    user_id: user.id,
    client_id: crypto.randomUUID(),
    logged_date: row.loggedDate,
    meal_type: row.mealType,
    food_name: row.foodName,
    food_source: "custom",
    external_food_id: null,
    brand: null,
    serving_description: "1 serving",
    quantity: 1,
    serving_grams: 1,
    calories: row.calories,
    protein_g: row.proteinG,
    fat_g: row.fatG,
    carbs_g: row.carbsG,
    line_items: null,
    servings_logged: null,
    updated_at: now,
  }));

  const { error: insertError } = await supabase
    .from("nutrition_logs")
    .insert(inserts);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: inserts.length,
    skipped: parsed.skipped,
    warnings: parsed.errors,
  });
}
