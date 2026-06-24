import { scaleMacrosFrom100g } from "@forgefit/nutrition-core";
import { todayLocalIsoDate } from "@/lib/datetime/local-date";
import { getUserTimeZone } from "@/lib/datetime/timezone";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const createLogSchema = z.object({
  clientId: z.string().uuid(),
  loggedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  foodName: z.string().min(1),
  foodSource: z.enum(["usda", "off", "custom"]),
  externalFoodId: z.string().optional(),
  brand: z.string().optional(),
  servingDescription: z.string().min(1),
  quantity: z.number().positive(),
  servingGrams: z.number().positive().default(100),
  per100g: z
    .object({
      calories: z.number().min(0),
      proteinG: z.number().min(0),
      fatG: z.number().min(0),
      carbsG: z.number().min(0),
    })
    .optional(),
  calories: z.number().min(0).optional(),
  proteinG: z.number().min(0).optional(),
  fatG: z.number().min(0).optional(),
  carbsG: z.number().min(0).optional(),
  lineItems: z
    .array(
      z.object({
        id: z.string(),
        foodId: z.string(),
        foodName: z.string(),
        servingLabel: z.string(),
        quantity: z.number(),
        calories: z.number(),
        proteinG: z.number(),
        carbsG: z.number(),
        fatG: z.number(),
      })
    )
    .optional(),
  servingsLogged: z.number().positive().optional(),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeZone = await getUserTimeZone();
  const date =
    searchParams.get("date") ??
    todayLocalIsoDate(new Date(), timeZone);

  const { data, error } = await supabase
    .from("nutrition_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("logged_date", date)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof createLogSchema>;
  try {
    const json = await request.json();
    const parsed = createLogSchema.safeParse(json);
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

  const totalGrams = body.servingGrams * body.quantity;
  const scaled = body.per100g
    ? scaleMacrosFrom100g(body.per100g, totalGrams)
    : {
        calories: body.calories ?? 0,
        proteinG: body.proteinG ?? 0,
        fatG: body.fatG ?? 0,
        carbsG: body.carbsG ?? 0,
      };

  const { data, error } = await supabase
    .from("nutrition_logs")
    .insert({
      user_id: user.id,
      client_id: body.clientId,
      logged_date: body.loggedDate,
      meal_type: body.mealType ?? null,
      food_name: body.foodName,
      food_source: body.foodSource,
      external_food_id: body.externalFoodId ?? null,
      brand: body.brand ?? null,
      serving_description: body.servingDescription,
      quantity: body.quantity,
      serving_grams: body.servingGrams,
      calories: scaled.calories,
      protein_g: scaled.proteinG,
      fat_g: scaled.fatG,
      carbs_g: scaled.carbsG,
      line_items: body.lineItems ?? null,
      servings_logged: body.servingsLogged ?? null,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message.includes("nutrition_logs")
            ? "Apply the Phase 4 migration (nutrition_logs table)."
            : error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ entry: data });
}
