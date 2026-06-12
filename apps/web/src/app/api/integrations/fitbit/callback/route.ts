import { fitbitRedirectUri, isGoogleHealthConfigured } from "@/lib/integrations/config";
import { completeFitbitOAuth } from "@/lib/integrations/service";
import {
  clearFitbitOAuthCookies,
  readFitbitOAuthCookies,
} from "@/lib/integrations/oauth-state";
import { getSiteUrl } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const siteUrl = getSiteUrl();
  const profileUrl = `${siteUrl}/profile#integrations`;

  if (!isGoogleHealthConfigured()) {
    return NextResponse.redirect(
      `${profileUrl}?integration_error=${encodeURIComponent("Fitbit integration is not configured.")}`
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    await clearFitbitOAuthCookies();
    return NextResponse.redirect(
      `${profileUrl}?integration_error=${encodeURIComponent("Fitbit authorization was canceled.")}`
    );
  }

  if (!code || !state) {
    await clearFitbitOAuthCookies();
    return NextResponse.redirect(
      `${profileUrl}?integration_error=${encodeURIComponent("Missing Fitbit authorization code.")}`
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stored = await readFitbitOAuthCookies();
  await clearFitbitOAuthCookies();

  if (!user) {
    return NextResponse.redirect(`${siteUrl}/login`);
  }

  if (
    !stored.state ||
    !stored.userId ||
    stored.state !== state ||
    stored.userId !== user.id
  ) {
    return NextResponse.redirect(
      `${profileUrl}?integration_error=${encodeURIComponent("Invalid OAuth session. Try connecting again.")}`
    );
  }

  try {
    await completeFitbitOAuth({
      userId: user.id,
      code,
      redirectUri: fitbitRedirectUri(siteUrl),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not connect Fitbit.";
    return NextResponse.redirect(
      `${profileUrl}?integration_error=${encodeURIComponent(message)}`
    );
  }

  return NextResponse.redirect(`${profileUrl}?integration=fitbit_connected`);
}
