import { createClient } from "@/lib/supabase/server";
import {
  FEATURE_SAVE_TEMPORARILY_UNAVAILABLE,
  memberFacingSchemaError,
} from "@/lib/ui/member-errors";
import { NextResponse } from "next/server";
import { z } from "zod";

const measurementSchema = z.object({
  measuredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().min(30).max(300).optional(),
  waistCm: z.number().min(30).max(250).optional(),
  chestCm: z.number().min(30).max(250).optional(),
  armsCm: z.number().min(10).max(100).optional(),
  legsCm: z.number().min(20).max(120).optional(),
  neckCm: z.number().min(20).max(80).optional(),
  hipsCm: z.number().min(30).max(250).optional(),
  bodyFatPct: z.number().min(3).max(60).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof measurementSchema>;
  try {
    const json = await request.json();
    const parsed = measurementSchema.safeParse(json);
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

  if (body.weightKg == null && body.bodyFatPct == null) {
    return NextResponse.json(
      { error: "Provide at least weight or body fat %" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("body_measurements")
    .select("*")
    .eq("user_id", user.id)
    .eq("measured_date", body.measuredDate)
    .maybeSingle();

  const { data, error } = await supabase
    .from("body_measurements")
    .upsert(
      {
        user_id: user.id,
        measured_date: body.measuredDate,
        weight_kg: body.weightKg ?? existing?.weight_kg ?? null,
        waist_cm: body.waistCm ?? existing?.waist_cm ?? null,
        chest_cm: body.chestCm ?? existing?.chest_cm ?? null,
        arms_cm: body.armsCm ?? existing?.arms_cm ?? null,
        legs_cm: body.legsCm ?? existing?.legs_cm ?? null,
        neck_cm: body.neckCm ?? existing?.neck_cm ?? null,
        hips_cm: body.hipsCm ?? existing?.hips_cm ?? null,
        body_fat_pct: body.bodyFatPct ?? existing?.body_fat_pct ?? null,
        notes: body.notes ?? existing?.notes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,measured_date" }
    )
    .select("*")
    .single();

  if (error) {
    console.error("body_measurements upsert:", error.message);
    return NextResponse.json(
      {
        error: error.message.includes("body_measurements")
          ? FEATURE_SAVE_TEMPORARILY_UNAVAILABLE
          : memberFacingSchemaError(error.message),
      },
      { status: 500 }
    );
  }

  if (body.weightKg != null) {
    await supabase
      .from("profiles")
      .update({ weight_kg: body.weightKg })
      .eq("id", user.id);
  }

  return NextResponse.json({ entry: data });
}
