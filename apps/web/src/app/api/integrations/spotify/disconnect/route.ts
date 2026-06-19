import { disconnectSpotify } from "@/lib/integrations/spotify-service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await disconnectSpotify(user.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not disconnect Spotify.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ disconnected: true });
}
