import {
  getWorkoutMusicProfilePrefs,
  startSpotifyWorkoutPlaylist,
} from "@/lib/integrations/spotify-service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Non-blocking auto-start when a workout session begins. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await getWorkoutMusicProfilePrefs(user.id);
  const result = await startSpotifyWorkoutPlaylist({
    userId: user.id,
    profileDefaultVibe: prefs.defaultVibe,
    requireAutoStart: true,
    profileAutoStart: prefs.autoStart,
  });

  if (!result.ok) {
    return NextResponse.json({ skipped: true, reason: result.reason });
  }

  return NextResponse.json({ ok: true });
}
