import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const patchLogSchema = z.object({
  foodName: z.string().min(1).optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).nullable().optional(),
  servingDescription: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
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
        quantity: z.number().positive(),
        calories: z.number().min(0),
        proteinG: z.number().min(0),
        carbsG: z.number().min(0),
        fatG: z.number().min(0),
      })
    )
    .nullable()
    .optional(),
  servingsLogged: z.number().positive().nullable().optional(),
});

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const { error } = await supabase
    .from("nutrition_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: z.infer<typeof patchLogSchema>;
  try {
    const json = await request.json();
    const parsed = patchLogSchema.safeParse(json);
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

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.foodName != null) updates.food_name = body.foodName;
  if (body.mealType !== undefined) updates.meal_type = body.mealType;
  if (body.servingDescription != null) {
    updates.serving_description = body.servingDescription;
  }
  if (body.quantity != null) updates.quantity = body.quantity;
  if (body.calories != null) updates.calories = body.calories;
  if (body.proteinG != null) updates.protein_g = body.proteinG;
  if (body.fatG != null) updates.fat_g = body.fatG;
  if (body.carbsG != null) updates.carbs_g = body.carbsG;
  if (body.lineItems !== undefined) updates.line_items = body.lineItems;
  if (body.servingsLogged !== undefined) {
    updates.servings_logged = body.servingsLogged;
  }

  const { data, error } = await supabase
    .from("nutrition_logs")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry: data });
}
