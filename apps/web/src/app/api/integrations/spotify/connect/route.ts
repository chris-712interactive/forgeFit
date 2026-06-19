import { buildSpotifyAuthorizeUrl } from "@forgefit/integrations";
import {
  getSpotifyClientConfig,
  isSpotifyConfigured,
  spotifyOAuthRedirectUri,
} from "@/lib/integrations/config";
import {
  createSpotifyPkcePair,
  setSpotifyOAuthCookies,
} from "@/lib/integrations/oauth-state";
import { createSignedIntegrationOAuthState } from "@/lib/integrations/oauth-state-token";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!isSpotifyConfigured()) {
    return NextResponse.json(
      { error: "Spotify integration is not configured." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId } = getSpotifyClientConfig();
  const redirectUri = spotifyOAuthRedirectUri(request);
  const state = createSignedIntegrationOAuthState(user.id);
  const { verifier, challenge } = createSpotifyPkcePair();

  await setSpotifyOAuthCookies(verifier, redirectUri);

  const authorizeUrl = buildSpotifyAuthorizeUrl({
    clientId,
    redirectUri,
    state,
    codeChallenge: challenge,
  });

  return NextResponse.redirect(authorizeUrl);
}
