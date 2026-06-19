import { getSpotifyPublicStatus } from "@/lib/integrations/spotify-service";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("workout_music_auto_start, workout_music_default_vibe")
    .eq("id", user.id)
    .maybeSingle();

  const status = await getSpotifyPublicStatus(user.id, profile);
  return NextResponse.json(status);
}
