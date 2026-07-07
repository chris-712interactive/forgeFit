import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { syncWorkoutScheduleOverrides } from "@/lib/workouts/schedule-overrides-server";

const syncSchema = z.object({
  programId: z.string().uuid().optional(),
  overrides: z.array(
    z.object({
      weekStartIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      dayIndex: z.number().int().min(0).max(6),
      adjustedDateIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      updatedAt: z.string().min(1),
    })
  ),
  deleted: z.array(
    z.object({
      weekStartIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      dayIndex: z.number().int().min(0).max(6),
    })
  ),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof syncSchema>;
  try {
    const json = await request.json();
    const parsed = syncSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Invalid payload: ${parsed.error.issues[0]?.message}` },
        { status: 400 }
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await syncWorkoutScheduleOverrides({
      userId: user.id,
      programId: body.programId,
      overrides: body.overrides,
      deleted: body.deleted,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Schedule sync failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("workout_schedule_overrides")
    .select(
      "week_start_date, day_index, adjusted_date, program_id, updated_at"
    )
    .eq("user_id", user.id)
    .order("week_start_date", { ascending: false });

  if (error) {
    if (
      error.code === "PGRST205" ||
      error.message?.toLowerCase().includes("workout_schedule_overrides")
    ) {
      return NextResponse.json({ overrides: [], tableReady: false });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    tableReady: true,
    overrides: (data ?? []).map((row) => ({
      weekStartIso: row.week_start_date as string,
      dayIndex: row.day_index as number,
      adjustedDateIso: row.adjusted_date as string,
      programId: (row.program_id as string | null) ?? undefined,
      updatedAt: row.updated_at as string,
    })),
  });
}
