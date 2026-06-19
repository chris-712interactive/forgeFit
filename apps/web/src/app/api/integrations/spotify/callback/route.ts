import {
  isSpotifyConfigured,
} from "@/lib/integrations/config";
import { completeSpotifyOAuth } from "@/lib/integrations/spotify-service";
import {
  clearSpotifyOAuthCookies,
  readSpotifyOAuthVerifierCookie,
} from "@/lib/integrations/oauth-state";
import {
  profileWorkoutMusicRedirectUrl,
  verifySignedIntegrationOAuthState,
} from "@/lib/integrations/oauth-state-token";
import { getSiteUrl } from "@/lib/seo/site-url";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const siteUrl = getSiteUrl();
  const redirectToProfile = (query?: Record<string, string | undefined>) =>
    NextResponse.redirect(profileWorkoutMusicRedirectUrl(siteUrl, query));
  const redirectWithError = (message: string) =>
    redirectToProfile({ spotify_error: message });

  if (!isSpotifyConfigured()) {
    return redirectWithError("Spotify integration is not configured.");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    await clearSpotifyOAuthCookies();
    return redirectWithError("Spotify authorization was canceled.");
  }

  if (!code || !state) {
    await clearSpotifyOAuthCookies();
    return redirectWithError("Missing Spotify authorization code.");
  }

  const verified = verifySignedIntegrationOAuthState(state);
  const codeVerifier = await readSpotifyOAuthVerifierCookie();
  await clearSpotifyOAuthCookies();

  if (!verified) {
    return redirectWithError("Invalid OAuth session. Try connecting again.");
  }

  if (!codeVerifier) {
    return redirectWithError("Missing PKCE verifier. Try connecting again.");
  }

  try {
    await completeSpotifyOAuth({
      userId: verified.userId,
      code,
      codeVerifier,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not connect Spotify.";
    return redirectWithError(message);
  }

  return redirectToProfile({ spotify: "connected" });
}
