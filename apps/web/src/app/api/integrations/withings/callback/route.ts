import { isWithingsConfigured, withingsRedirectUri } from "@/lib/integrations/config";
import { completeWithingsOAuth } from "@/lib/integrations/service";
import {
  clearWithingsOAuthCookies,
  readWithingsOAuthCookies,
} from "@/lib/integrations/oauth-state";
import { getSiteUrl } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const siteUrl = getSiteUrl();
  const profileUrl = `${siteUrl}/profile#integrations`;

  if (!isWithingsConfigured()) {
    return NextResponse.redirect(
      `${profileUrl}?integration_error=${encodeURIComponent("Withings is not configured.")}`
    );
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    await clearWithingsOAuthCookies();
    return NextResponse.redirect(
      `${profileUrl}?integration_error=${encodeURIComponent("Withings authorization was canceled.")}`
    );
  }

  if (!code || !state) {
    await clearWithingsOAuthCookies();
    return NextResponse.redirect(
      `${profileUrl}?integration_error=${encodeURIComponent("Missing Withings authorization code.")}`
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stored = await readWithingsOAuthCookies();
  await clearWithingsOAuthCookies();

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
    await completeWithingsOAuth({
      userId: user.id,
      code,
      redirectUri: withingsRedirectUri(siteUrl),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not connect Withings.";
    return NextResponse.redirect(
      `${profileUrl}?integration_error=${encodeURIComponent(message)}`
    );
  }

  return NextResponse.redirect(`${profileUrl}?integration=withings_connected`);
}
