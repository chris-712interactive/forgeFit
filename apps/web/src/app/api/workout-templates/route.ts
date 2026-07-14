import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const exerciseSchema = z.object({
  exerciseId: z.string().min(1),
  name: z.string().min(1),
  sets: z.number().int().min(1).max(10),
  reps: z.string().min(1),
  restSeconds: z.number().int().min(0).max(600),
});

const templateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(80),
  exercises: z.array(exerciseSchema).min(1).max(20),
  warmup: z
    .object({
      name: z.string(),
      durationMinutes: z.number().int().positive(),
      focus: z.enum(["push", "pull", "legs", "full_body", "general"]),
      movements: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          prescription: z.string(),
        })
      ),
    })
    .optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionForUser(user.id);
  if (!hasFeature(subscription, "custom_workouts")) {
    return NextResponse.json(
      { error: "Custom workouts are available on Pro and Pro+." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("user_workout_templates")
    .select("id, name, exercises, warmup, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    const missing = error.message.toLowerCase().includes("user_workout_templates");
    if (missing) {
      return NextResponse.json({ templates: [], tableReady: false });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data ?? [], tableReady: true });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionForUser(user.id);
  if (!hasFeature(subscription, "custom_workouts")) {
    return NextResponse.json(
      { error: "Custom workouts are available on Pro and Pro+." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid template." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const row = {
    id: parsed.data.id ?? crypto.randomUUID(),
    user_id: user.id,
    name: parsed.data.name.trim(),
    exercises: parsed.data.exercises,
    warmup: parsed.data.warmup ?? null,
    updated_at: now,
    ...(parsed.data.id ? {} : { created_at: now }),
  };

  const { data, error } = await supabase
    .from("user_workout_templates")
    .upsert(row, { onConflict: "user_id,name" })
    .select("id, name, exercises, warmup, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionForUser(user.id);
  if (!hasFeature(subscription, "custom_workouts")) {
    return NextResponse.json(
      { error: "Custom workouts are available on Pro and Pro+." },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Template id required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_workout_templates")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
