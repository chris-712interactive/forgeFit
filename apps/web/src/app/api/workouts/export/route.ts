import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import { buildCompletedWorkoutsCsv } from "@/lib/workouts/export-csv";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionForUser(user.id);
  if (!hasFeature(subscription, "data_export")) {
    return NextResponse.json(
      { error: "Workout export is available on Pro and Pro+." },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const source = url.searchParams.get("source");

  const { records } = await getServerSessionRecords(user.id, 500);
  let sessions = records.filter((session) => session.status === "completed");

  if (sessionId) {
    sessions = sessions.filter((session) => session.clientId === sessionId);
  }

  if (source) {
    const allowed = new Set(source.split(",").map((value) => value.trim()));
    sessions = sessions.filter((session) =>
      allowed.has(session.sessionSource ?? "program")
    );
  }

  const csv = buildCompletedWorkoutsCsv(sessions, new Date().toISOString());
  const dateStamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="forgerep-workouts-${dateStamp}.csv"`,
    },
  });
}
