import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { hasFeature } from "@/lib/billing/gates";
import { MAX_WORKOUT_IMPORT_BYTES } from "@/lib/workouts/session-source";
import { parseForgeRepWorkoutCsv } from "@/lib/workouts/workout-csv-parser";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionForUser(user.id);
  if (!hasFeature(subscription, "workout_import")) {
    return NextResponse.json(
      { error: "Workout CSV import is available on Pro and Pro+." },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a CSV file to import." }, { status: 400 });
  }

  if (file.size > MAX_WORKOUT_IMPORT_BYTES) {
    return NextResponse.json(
      { error: "File is too large. Keep templates under 512 KB." },
      { status: 400 }
    );
  }

  const csvText = await file.text();
  const parsed = parseForgeRepWorkoutCsv(csvText);

  if (!parsed.workout) {
    return NextResponse.json(
      { error: parsed.errors.join(" "), errors: parsed.errors },
      { status: 400 }
    );
  }

  return NextResponse.json({
    workout: parsed.workout,
    warnings: [...parsed.warnings, ...parsed.errors],
  });
}
