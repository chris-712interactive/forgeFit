import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import { createClient } from "@/lib/supabase/server";
import {
  validateWeekReplaceAssignments,
  weekDateRange,
} from "@/lib/workouts/week-program-clear-core";
import { NextResponse } from "next/server";
import { z } from "zod";

const weekStartSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "weekStartIso must be YYYY-MM-DD");

const replaceSchema = z.object({
  weekStartIso: weekStartSchema,
  /** When true (default), mark the program week cleared. */
  clearProgramWeek: z.boolean().default(true),
  /** Replace custom assignments in the week with this list (empty = clear customs). */
  assignments: z
    .array(
      z.object({
        scheduledDateIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        templateId: z.string().uuid(),
      })
    )
    .default([]),
});

async function requireProUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const subscription = await getSubscriptionForUser(user.id);
  if (!hasFeature(subscription, "custom_workouts")) {
    return {
      error: NextResponse.json(
        { error: "Custom workouts are available on Pro and Pro+." },
        { status: 403 }
      ),
    };
  }

  return { supabase, user };
}

export async function GET() {
  const auth = await requireProUser();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("user_workout_week_program_clears")
    .select("id, week_start_date, created_at, updated_at")
    .eq("user_id", user.id)
    .order("week_start_date", { ascending: false });

  if (error) {
    const missing = error.message
      .toLowerCase()
      .includes("user_workout_week_program_clears");
    if (missing) {
      return NextResponse.json({ weekStarts: [], tableReady: false });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    tableReady: true,
    weekStarts: (data ?? []).map((row) => String(row.week_start_date)),
    clears: (data ?? []).map((row) => ({
      id: row.id,
      weekStartIso: row.week_start_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  });
}

/**
 * Clear the program week and optionally replace the week's custom assignments.
 * Body: { weekStartIso, clearProgramWeek?, assignments? }
 */
export async function POST(request: Request) {
  const auth = await requireProUser();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = replaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const { weekStartIso, clearProgramWeek, assignments } = parsed.data;
  const validated = validateWeekReplaceAssignments(weekStartIso, assignments);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const weekEndIso = weekDateRange(weekStartIso)[6]!;
  const now = new Date().toISOString();

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
    if (missing) {
      return NextResponse.json(
        {
          error:
            "Workout day assignments are not available yet. Apply the Phase 11 migrations.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: clearAssignmentsError.message },
      { status: 500 }
    );
  }

  let clearedWeekStart: string | null = null;
  if (clearProgramWeek) {
    const { data: existingClear } = await supabase
      .from("user_workout_week_program_clears")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start_date", weekStartIso)
      .maybeSingle();

    const clearRow = {
      id: existingClear?.id ?? crypto.randomUUID(),
      user_id: user.id,
      week_start_date: weekStartIso,
      updated_at: now,
      ...(existingClear ? {} : { created_at: now }),
    };

    const { data: clearData, error: clearError } = await supabase
      .from("user_workout_week_program_clears")
      .upsert(clearRow, { onConflict: "user_id,week_start_date" })
      .select("week_start_date")
      .single();

    if (clearError) {
      const missing = clearError.message
        .toLowerCase()
        .includes("user_workout_week_program_clears");
      if (missing) {
        return NextResponse.json(
          {
            error:
              "Week program clear is not available yet. Apply the latest migration.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: clearError.message }, { status: 500 });
    }
    clearedWeekStart = String(clearData.week_start_date);
  }

  const createdAssignments: Array<{
    id: string;
    templateId: string;
    scheduledDateIso: string;
    replacesProgram: boolean;
    templateName: string;
  }> = [];

  for (const assignment of assignments) {
    const { data: template } = await supabase
      .from("user_workout_templates")
      .select("id, name")
      .eq("user_id", user.id)
      .eq("id", assignment.templateId)
      .maybeSingle();

    const row = {
      id: crypto.randomUUID(),
      user_id: user.id,
      template_id: assignment.templateId,
      scheduled_date: assignment.scheduledDateIso,
      replaces_program: true,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("user_workout_day_assignments")
      .insert(row)
      .select("id, template_id, scheduled_date, replaces_program")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    createdAssignments.push({
      id: data.id,
      templateId: data.template_id,
      scheduledDateIso: data.scheduled_date,
      replacesProgram: data.replaces_program,
      templateName: template?.name ?? "Custom workout",
    });
  }

  return NextResponse.json({
    weekStartIso,
    weekEndIso,
    programWeekCleared: Boolean(clearedWeekStart),
    assignments: createdAssignments,
  });
}

/** Restore the program week (remove week-clear flag). Keeps custom assignments. */
export async function DELETE(request: Request) {
  const auth = await requireProUser();
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user } = auth;

  const url = new URL(request.url);
  const weekStartIso = url.searchParams.get("weekStartIso");
  const parsed = weekStartSchema.safeParse(weekStartIso);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "weekStartIso query param required (YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("user_workout_week_program_clears")
    .delete()
    .eq("user_id", user.id)
    .eq("week_start_date", parsed.data);

  if (error) {
    const missing = error.message
      .toLowerCase()
      .includes("user_workout_week_program_clears");
    if (missing) {
      return NextResponse.json({ ok: true, tableReady: false });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, weekStartIso: parsed.data });
}
