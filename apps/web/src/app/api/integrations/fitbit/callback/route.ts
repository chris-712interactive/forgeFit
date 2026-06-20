import {
  fitbitOAuthRedirectUri,
  isGoogleHealthConfigured,
} from "@/lib/integrations/config";
import { completeFitbitOAuth } from "@/lib/integrations/service";
import { formatIntegrationErrorForUser } from "@/lib/integrations/user-errors";
import { clearFitbitOAuthCookies } from "@/lib/integrations/oauth-state";
import {
  integrationOAuthCallbackProbeResponse,
  isIntegrationOAuthCallbackProbe,
} from "@/lib/integrations/oauth-callback-probe";
import {
  profileIntegrationsRedirectUrl,
  verifySignedIntegrationOAuthState,
} from "@/lib/integrations/oauth-state-token";
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

  if (!isGoogleHealthConfigured()) {
    return redirectWithError("Fitbit integration is not configured.");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    await clearFitbitOAuthCookies();
    return redirectWithError("Fitbit authorization was canceled.");
  }

  if (!code || !state) {
    await clearFitbitOAuthCookies();
    return redirectWithError("Missing Fitbit authorization code.");
  }

  const verified = verifySignedIntegrationOAuthState(state);
  await clearFitbitOAuthCookies();

  if (!verified) {
    return redirectWithError("Invalid OAuth session. Try connecting again.");
  }

  try {
    await completeFitbitOAuth({
      userId: verified.userId,
      code,
      redirectUri: fitbitOAuthRedirectUri(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not connect Fitbit.";
    return redirectWithError(message);
  }

  return redirectToProfile({ integration: "fitbit_connected" });
}
