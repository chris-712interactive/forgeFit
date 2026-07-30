import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import { createClient } from "@/lib/supabase/server";
import {
  deleteProgramWeekClear,
  listProgramWeekClearsForUser,
  upsertProgramWeekClear,
} from "@/lib/workouts/week-clears-server";
import { NextResponse } from "next/server";
import { z } from "zod";

const clearSchema = z.object({
  weekStartIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  programId: z.string().uuid().optional(),
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

  const result = await listProgramWeekClearsForUser(user.id);
  return NextResponse.json({
    clears: result.clears,
    tableReady: result.tableReady,
  });
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

  const parsed = clearSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid week clear." },
      { status: 400 }
    );
  }

  try {
    const clear = await upsertProgramWeekClear({
      userId: user.id,
      weekStartIso: parsed.data.weekStartIso,
      programId: parsed.data.programId,
    });
    return NextResponse.json({ clear });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not clear week.";
    if (message.toLowerCase().includes("user_program_week_clears")) {
      return NextResponse.json(
        { error: "Week clearing is temporarily unavailable.", tableReady: false },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
  const weekStartIso = url.searchParams.get("weekStartIso");
  if (!weekStartIso || !/^\d{4}-\d{2}-\d{2}$/.test(weekStartIso)) {
    return NextResponse.json(
      { error: "weekStartIso required (YYYY-MM-DD)." },
      { status: 400 }
    );
  }

  try {
    await deleteProgramWeekClear({
      userId: user.id,
      weekStartIso,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not restore week.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
