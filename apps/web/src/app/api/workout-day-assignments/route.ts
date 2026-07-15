import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const assignmentSchema = z.object({
  id: z.string().uuid().optional(),
  templateId: z.string().uuid(),
  scheduledDateIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  replacesProgram: z.boolean().default(false),
  /** When true, remove other assignments on the same date before creating. */
  clearOtherAssignmentsOnDate: z.boolean().default(false),
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
    .from("user_workout_day_assignments")
    .select(
      "id, template_id, scheduled_date, replaces_program, created_at, updated_at, user_workout_templates(name)"
    )
    .eq("user_id", user.id)
    .order("scheduled_date", { ascending: true });

  if (error) {
    const missing = error.message
      .toLowerCase()
      .includes("user_workout_day_assignments");
    if (missing) {
      return NextResponse.json({ assignments: [], tableReady: false });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const assignments = (data ?? []).map((row) => {
    const templateJoin = row.user_workout_templates as
      | { name?: string }
      | { name?: string }[]
      | null;
    const templateName = Array.isArray(templateJoin)
      ? templateJoin[0]?.name
      : templateJoin?.name;

    return {
      id: row.id,
      templateId: row.template_id,
      scheduledDateIso: row.scheduled_date,
      replacesProgram: row.replaces_program,
      templateName: templateName ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  return NextResponse.json({ assignments, tableReady: true });
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

  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid assignment." },
      { status: 400 }
    );
  }

  const { templateId, scheduledDateIso, replacesProgram, clearOtherAssignmentsOnDate } =
    parsed.data;

  const { data: template, error: templateError } = await supabase
    .from("user_workout_templates")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("id", templateId)
    .maybeSingle();

  if (templateError || !template) {
    return NextResponse.json(
      { error: "Template not found." },
      { status: 404 }
    );
  }

  if (clearOtherAssignmentsOnDate) {
    const { error: clearError } = await supabase
      .from("user_workout_day_assignments")
      .delete()
      .eq("user_id", user.id)
      .eq("scheduled_date", scheduledDateIso);
    if (clearError) {
      return NextResponse.json({ error: clearError.message }, { status: 500 });
    }
  }

  const now = new Date().toISOString();
  const row = {
    id: parsed.data.id ?? crypto.randomUUID(),
    user_id: user.id,
    template_id: templateId,
    scheduled_date: scheduledDateIso,
    replaces_program: replacesProgram,
    updated_at: now,
    ...(parsed.data.id ? {} : { created_at: now }),
  };

  const { data, error } = await supabase
    .from("user_workout_day_assignments")
    .upsert(row, { onConflict: "user_id,template_id,scheduled_date" })
    .select("id, template_id, scheduled_date, replaces_program, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    assignment: {
      id: data.id,
      templateId: data.template_id,
      scheduledDateIso: data.scheduled_date,
      replacesProgram: data.replaces_program,
      templateName: template.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
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
    return NextResponse.json({ error: "Assignment id required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_workout_day_assignments")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
