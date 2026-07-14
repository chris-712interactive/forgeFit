import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const intervalProtocolSchema = z.object({
  mode: z.enum(["density", "tabata", "superset_block"]),
  workSeconds: z.number().int().min(1).max(3600),
  restSeconds: z.number().int().min(0).max(3600),
  rounds: z.number().int().min(1).max(30),
  betweenExerciseRestSeconds: z.number().int().min(0).max(600).optional(),
});

const exerciseSchema = z.object({
  exerciseId: z.string().min(1),
  name: z.string().min(1),
  sets: z.number().int().min(1).max(12),
  reps: z.string().min(1),
  restSeconds: z.number().int().min(0).max(600),
  groupId: z.string().max(4).optional(),
});

const templateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(80),
  exercises: z.array(exerciseSchema).min(1).max(20),
  intervalProtocol: intervalProtocolSchema.optional(),
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
    .select("id, name, exercises, warmup, interval_protocol, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    const missing = error.message.toLowerCase().includes("user_workout_templates");
    if (missing) {
      return NextResponse.json({ templates: [], tableReady: false });
    }
    // Column may not exist yet — retry without interval_protocol.
    if (error.message.toLowerCase().includes("interval_protocol")) {
      const fallback = await supabase
        .from("user_workout_templates")
        .select("id, name, exercises, warmup, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 });
      }
      return NextResponse.json({
        templates: (fallback.data ?? []).map((row) => ({
          ...row,
          interval_protocol: null,
        })),
        tableReady: true,
      });
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
    interval_protocol: parsed.data.intervalProtocol ?? null,
    updated_at: now,
    ...(parsed.data.id ? {} : { created_at: now }),
  };

  const { data, error } = await supabase
    .from("user_workout_templates")
    .upsert(row, { onConflict: "user_id,name" })
    .select("id, name, exercises, warmup, interval_protocol, created_at, updated_at")
    .single();

  if (error) {
    if (error.message.toLowerCase().includes("interval_protocol")) {
      const { interval_protocol: _drop, ...withoutProtocol } = row;
      const fallback = await supabase
        .from("user_workout_templates")
        .upsert(withoutProtocol, { onConflict: "user_id,name" })
        .select("id, name, exercises, warmup, created_at, updated_at")
        .single();
      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 });
      }
      return NextResponse.json({
        template: { ...fallback.data, interval_protocol: null },
      });
    }
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
