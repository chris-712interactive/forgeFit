import {
  controlSpotifyPlayback,
  getSpotifyPlaybackView,
  getSpotifyPublicStatus,
  getWorkoutMusicProfilePrefs,
  startSpotifyWorkoutPlaylist,
} from "@/lib/integrations/spotify-service";
import { isWorkoutMusicVibe } from "@/lib/workout-music/catalog";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const playback = await getSpotifyPlaybackView(user.id);
  return NextResponse.json(playback);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    action?: string;
    vibe?: string;
  };

  const prefs = await getWorkoutMusicProfilePrefs(user.id);

  if (body.action === "start") {
    const vibe =
      body.vibe && isWorkoutMusicVibe(body.vibe) ? body.vibe : undefined;
    const result = await startSpotifyWorkoutPlaylist({
      userId: user.id,
      vibe,
      profileDefaultVibe: prefs.defaultVibe,
      requireAutoStart: false,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  }

  if (
    body.action === "pause" ||
    body.action === "next" ||
    body.action === "previous" ||
    body.action === "resume" ||
    body.action === "toggle"
  ) {
    const result = await controlSpotifyPlayback({
      userId: user.id,
      action: body.action,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 409 });
    }

    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
