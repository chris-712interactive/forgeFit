import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const assignmentSchema = z.object({
  templateId: z.string().uuid(),
  scheduledDateIso: isoDate,
});

const clearWeekSchema = z.object({
  weekStartIso: isoDate,
  weekEndIso: isoDate,
  programId: z.string().uuid().nullable().optional(),
  /** Optional custom templates to assign after clearing (replaces program on those dates). */
  assignments: z.array(assignmentSchema).max(14).default([]),
  /**
   * When true, remove existing custom day assignments in the week range
   * before creating the new ones (full replace).
   */
  clearExistingAssignmentsInWeek: z.boolean().default(false),
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
      { error: "Clearing a week for custom workouts is available on Pro and Pro+." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("user_program_week_clears")
    .select("id, week_start_date, program_id, created_at, updated_at")
    .eq("user_id", user.id)
    .order("week_start_date", { ascending: false });

  if (error) {
    const missing = error.message
      .toLowerCase()
      .includes("user_program_week_clears");
    if (missing) {
      return NextResponse.json({ clears: [], tableReady: false });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const clears = (data ?? []).map((row) => ({
    id: row.id,
    weekStartIso: row.week_start_date,
    programId: row.program_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return NextResponse.json({ clears, tableReady: true });
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
      { error: "Clearing a week for custom workouts is available on Pro and Pro+." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = clearWeekSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid clear-week payload." },
      { status: 400 }
    );
  }

  const {
    weekStartIso,
    weekEndIso,
    programId,
    assignments,
    clearExistingAssignmentsInWeek,
  } = parsed.data;

  if (weekEndIso < weekStartIso) {
    return NextResponse.json(
      { error: "weekEndIso must be on or after weekStartIso." },
      { status: 400 }
    );
  }

  for (const row of assignments) {
    if (
      row.scheduledDateIso < weekStartIso ||
      row.scheduledDateIso > weekEndIso
    ) {
      return NextResponse.json(
        {
          error: `Assignment date ${row.scheduledDateIso} is outside the cleared week.`,
        },
        { status: 400 }
      );
    }
  }

  if (assignments.length > 0) {
    const templateIds = [...new Set(assignments.map((row) => row.templateId))];
    const { data: templates, error: templateError } = await supabase
      .from("user_workout_templates")
      .select("id, name")
      .eq("user_id", user.id)
      .in("id", templateIds);

    if (templateError) {
      return NextResponse.json({ error: templateError.message }, { status: 500 });
    }
    if ((templates ?? []).length !== templateIds.length) {
      return NextResponse.json(
        { error: "One or more templates were not found." },
        { status: 404 }
      );
    }
  }

  if (clearExistingAssignmentsInWeek) {
    const { error: clearAssignmentsError } = await supabase
      .from("user_workout_day_assignments")
      .delete()
      .eq("user_id", user.id)
      .gte("scheduled_date", weekStartIso)
      .lte("scheduled_date", weekEndIso);

    if (clearAssignmentsError) {
      const missing = clearAssignmentsError.message
        .toLowerCase()
        .includes("user_workout_day_assignments");
      if (!missing) {
        return NextResponse.json(
          { error: clearAssignmentsError.message },
          { status: 500 }
        );
      }
    }
  }

  const now = new Date().toISOString();
  const { data: clearRow, error: clearError } = await supabase
    .from("user_program_week_clears")
    .upsert(
      {
        user_id: user.id,
        program_id: programId ?? null,
        week_start_date: weekStartIso,
        updated_at: now,
      },
      { onConflict: "user_id,week_start_date" }
    )
    .select("id, week_start_date, program_id, created_at, updated_at")
    .single();

  if (clearError) {
    const missing = clearError.message
      .toLowerCase()
      .includes("user_program_week_clears");
    if (missing) {
      return NextResponse.json(
        {
          error:
            "Week clearing is not available yet. Apply the latest Supabase migrations.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: clearError.message }, { status: 500 });
  }

  const createdAssignments: Array<{
    id: string;
    templateId: string;
    scheduledDateIso: string;
    replacesProgram: boolean;
    templateName: string | null;
  }> = [];

  for (const row of assignments) {
    if (!clearExistingAssignmentsInWeek) {
      const { error: dateClearError } = await supabase
        .from("user_workout_day_assignments")
        .delete()
        .eq("user_id", user.id)
        .eq("scheduled_date", row.scheduledDateIso);
      if (dateClearError) {
        return NextResponse.json(
          { error: dateClearError.message },
          { status: 500 }
        );
      }
    }

    const { data: template } = await supabase
      .from("user_workout_templates")
      .select("name")
      .eq("user_id", user.id)
      .eq("id", row.templateId)
      .maybeSingle();

    const assignmentId = crypto.randomUUID();
    const { data: assignment, error: assignError } = await supabase
      .from("user_workout_day_assignments")
      .upsert(
        {
          id: assignmentId,
          user_id: user.id,
          template_id: row.templateId,
          scheduled_date: row.scheduledDateIso,
          replaces_program: true,
          created_at: now,
          updated_at: now,
        },
        { onConflict: "user_id,template_id,scheduled_date" }
      )
      .select("id, template_id, scheduled_date, replaces_program")
      .single();

    if (assignError) {
      return NextResponse.json({ error: assignError.message }, { status: 500 });
    }

    createdAssignments.push({
      id: assignment.id,
      templateId: assignment.template_id,
      scheduledDateIso: assignment.scheduled_date,
      replacesProgram: assignment.replaces_program,
      templateName: template?.name ?? null,
    });
  }

  revalidatePath("/workout");
  revalidatePath("/home");

  return NextResponse.json({
    clear: {
      id: clearRow.id,
      weekStartIso: clearRow.week_start_date,
      programId: clearRow.program_id,
      createdAt: clearRow.created_at,
      updatedAt: clearRow.updated_at,
    },
    assignments: createdAssignments,
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
      { error: "Clearing a week for custom workouts is available on Pro and Pro+." },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const weekStartIso = url.searchParams.get("weekStartIso");
  const id = url.searchParams.get("id");

  if (!weekStartIso && !id) {
    return NextResponse.json(
      { error: "weekStartIso or id is required." },
      { status: 400 }
    );
  }

  let query = supabase
    .from("user_program_week_clears")
    .delete()
    .eq("user_id", user.id);

  if (id) {
    query = query.eq("id", id);
  } else if (weekStartIso) {
    query = query.eq("week_start_date", weekStartIso);
  }

  const { error } = await query;
  if (error) {
    const missing = error.message
      .toLowerCase()
      .includes("user_program_week_clears");
    if (missing) {
      return NextResponse.json(
        {
          error:
            "Week clearing is not available yet. Apply the latest Supabase migrations.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/workout");
  revalidatePath("/home");

  return NextResponse.json({ ok: true });
}
