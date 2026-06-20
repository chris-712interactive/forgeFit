import { isStravaConfigured } from "@/lib/integrations/config";
import { completeStravaOAuth } from "@/lib/integrations/service";
import {
  profileIntegrationsRedirectUrl,
  verifySignedIntegrationOAuthState,
} from "@/lib/integrations/oauth-state-token";
import { formatIntegrationErrorForUser } from "@/lib/integrations/user-errors";
import {
  integrationOAuthCallbackProbeResponse,
  isIntegrationOAuthCallbackProbe,
} from "@/lib/integrations/oauth-callback-probe";
import { getSiteUrl } from "@/lib/seo/site-url";
import { NextResponse } from "next/server";

export async function HEAD(request: Request) {
  return integrationOAuthCallbackProbeResponse(request);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (isIntegrationOAuthCallbackProbe(request, url.searchParams)) {
    return integrationOAuthCallbackProbeResponse(request);
  }

  const siteUrl = getSiteUrl();
  const redirectToProfile = (query?: Record<string, string | undefined>) =>
    NextResponse.redirect(profileIntegrationsRedirectUrl(siteUrl, query));
  const redirectWithError = (message: string) =>
    redirectToProfile({
      integration_error: formatIntegrationErrorForUser(message),
    });

  if (!isStravaConfigured()) {
    return redirectWithError("Strava integration is not configured.");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return redirectWithError("Strava authorization was canceled.");
  }

  if (!code || !state) {
    return redirectWithError("Missing Strava authorization code.");
  }

  const verified = verifySignedIntegrationOAuthState(state);
  if (!verified) {
    return redirectWithError("Invalid OAuth session. Try connecting again.");
  }

  try {
    await completeStravaOAuth({
      userId: verified.userId,
      code,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not connect Strava.";
    return redirectWithError(message);
  }

  return redirectToProfile({ integration: "strava_connected" });
}
