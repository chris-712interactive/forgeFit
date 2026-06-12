import {
  fitbitOAuthRedirectUri,
  isGoogleHealthConfigured,
} from "@/lib/integrations/config";
import { completeFitbitOAuth } from "@/lib/integrations/service";
import { clearFitbitOAuthCookies } from "@/lib/integrations/oauth-state";
import {
  profileIntegrationsRedirectUrl,
  verifySignedIntegrationOAuthState,
} from "@/lib/integrations/oauth-state-token";
import { getSiteUrl } from "@/lib/seo/site-url";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const siteUrl = getSiteUrl();
  const redirectToProfile = (query?: Record<string, string | undefined>) =>
    NextResponse.redirect(profileIntegrationsRedirectUrl(siteUrl, query));

  if (!isGoogleHealthConfigured()) {
    return redirectToProfile({
      integration_error: "Fitbit integration is not configured.",
    });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    await clearFitbitOAuthCookies();
    return redirectToProfile({
      integration_error: "Fitbit authorization was canceled.",
    });
  }

  if (!code || !state) {
    await clearFitbitOAuthCookies();
    return redirectToProfile({
      integration_error: "Missing Fitbit authorization code.",
    });
  }

  const verified = verifySignedIntegrationOAuthState(state);
  await clearFitbitOAuthCookies();

  if (!verified) {
    return redirectToProfile({
      integration_error: "Invalid OAuth session. Try connecting again.",
    });
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
    return redirectToProfile({ integration_error: message });
  }

  return redirectToProfile({ integration: "fitbit_connected" });
}
