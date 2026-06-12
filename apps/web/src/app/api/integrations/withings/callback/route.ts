import { isWithingsConfigured, withingsOAuthRedirectUri } from "@/lib/integrations/config";
import { completeWithingsOAuth } from "@/lib/integrations/service";
import { formatIntegrationErrorForUser } from "@/lib/integrations/user-errors";
import { clearWithingsOAuthCookies } from "@/lib/integrations/oauth-state";
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

  if (!isWithingsConfigured()) {
    return redirectToProfile({
      integration_error: "Withings is not configured.",
    });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    await clearWithingsOAuthCookies();
    return redirectToProfile({
      integration_error: "Withings authorization was canceled.",
    });
  }

  if (!code || !state) {
    await clearWithingsOAuthCookies();
    return redirectToProfile({
      integration_error: "Missing Withings authorization code.",
    });
  }

  const verified = verifySignedIntegrationOAuthState(state);
  await clearWithingsOAuthCookies();

  if (!verified) {
    return redirectToProfile({
      integration_error: "Invalid OAuth session. Try connecting again.",
    });
  }

  try {
    await completeWithingsOAuth({
      userId: verified.userId,
      code,
      redirectUri: withingsOAuthRedirectUri(),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not connect Withings.";
    return redirectToProfile({
      integration_error: formatIntegrationErrorForUser(message),
    });
  }

  return redirectToProfile({ integration: "withings_connected" });
}
