import { calculateJacksonPollock } from "@forgefit/projection-engine";
import { createClient } from "@/lib/supabase/server";
import {
  FEATURE_SAVE_TEMPORARILY_UNAVAILABLE,
  memberFacingSchemaError,
} from "@/lib/ui/member-errors";
import { NextResponse } from "next/server";
import { z } from "zod";

const caliperSchema = z.object({
  measuredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  formula: z.enum(["jp3", "jp7"]),
  sex: z.enum(["male", "female"]),
  age: z.number().min(13).max(120),
  skinfolds: z.object({
    chest: z.number().min(0).optional(),
    abdominal: z.number().min(0).optional(),
    thigh: z.number().min(0).optional(),
    tricep: z.number().min(0).optional(),
    suprailiac: z.number().min(0).optional(),
    midaxillary: z.number().min(0).optional(),
    subscapular: z.number().min(0).optional(),
  }),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof caliperSchema>;
  try {
    const json = await request.json();
    const parsed = caliperSchema.safeParse(json);
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

  let result;
  try {
    result = calculateJacksonPollock(
      body.formula,
      body.sex,
      body.age,
      {
        chest: body.skinfolds.chest,
        abdominal: body.skinfolds.abdominal,
        thigh: body.skinfolds.thigh,
        tricep: body.skinfolds.tricep,
        suprailiac: body.skinfolds.suprailiac,
        midaxillary: body.skinfolds.midaxillary,
        subscapular: body.skinfolds.subscapular,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid skinfold values",
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("caliper_measurements")
    .upsert(
      {
        user_id: user.id,
        measured_date: body.measuredDate,
        formula: body.formula,
        chest_mm: body.skinfolds.chest ?? null,
        abdominal_mm: body.skinfolds.abdominal ?? null,
        thigh_mm: body.skinfolds.thigh ?? null,
        tricep_mm: body.skinfolds.tricep ?? null,
        suprailiac_mm: body.skinfolds.suprailiac ?? null,
        midaxillary_mm: body.skinfolds.midaxillary ?? null,
        subscapular_mm: body.skinfolds.subscapular ?? null,
        sum_mm: result.sumMm,
        body_fat_pct: result.bodyFatPct,
      },
      { onConflict: "user_id,measured_date" }
    )
    .select("*")
    .single();

  if (error) {
    console.error("caliper_measurements upsert:", error.message);
    return NextResponse.json(
      {
        error: error.message.includes("caliper_measurements")
          ? FEATURE_SAVE_TEMPORARILY_UNAVAILABLE
          : memberFacingSchemaError(error.message),
      },
      { status: 500 }
    );
  }

  const { data: existingBody } = await supabase
    .from("body_measurements")
    .select("*")
    .eq("user_id", user.id)
    .eq("measured_date", body.measuredDate)
    .maybeSingle();

  await supabase.from("body_measurements").upsert(
    {
      user_id: user.id,
      measured_date: body.measuredDate,
      weight_kg: existingBody?.weight_kg ?? null,
      waist_cm: existingBody?.waist_cm ?? null,
      chest_cm: existingBody?.chest_cm ?? null,
      arms_cm: existingBody?.arms_cm ?? null,
      legs_cm: existingBody?.legs_cm ?? null,
      neck_cm: existingBody?.neck_cm ?? null,
      hips_cm: existingBody?.hips_cm ?? null,
      body_fat_pct: result.bodyFatPct,
      notes: existingBody?.notes ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,measured_date" }
  );

  return NextResponse.json({ entry: data, result });
}
