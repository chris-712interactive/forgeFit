import { updateWorkoutMusicProfilePrefs } from "@/lib/integrations/spotify-service";
import { isWorkoutMusicVibe } from "@/lib/workout-music/catalog";
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

  const body = (await request.json()) as {
    autoStart?: boolean;
    defaultVibe?: string | null;
  };

  if (
    body.defaultVibe != null &&
    body.defaultVibe !== "" &&
    !isWorkoutMusicVibe(body.defaultVibe)
  ) {
    return NextResponse.json({ error: "Invalid vibe." }, { status: 400 });
  }

  try {
    await updateWorkoutMusicProfilePrefs({
      userId: user.id,
      autoStart: body.autoStart,
      defaultVibe:
        body.defaultVibe === undefined
          ? undefined
          : body.defaultVibe && isWorkoutMusicVibe(body.defaultVibe)
            ? body.defaultVibe
            : null,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not save workout music settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
