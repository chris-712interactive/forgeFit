import { isWithingsConfigured, withingsOAuthRedirectUri } from "@/lib/integrations/config";
import { completeWithingsOAuth } from "@/lib/integrations/service";
import {
  clearWithingsOAuthCookies,
  readWithingsOAuthCookies,
} from "@/lib/integrations/oauth-state";
import { getSiteUrl } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function isValidOAuthSession(params: {
  state: string;
  storedState: string | null;
  storedUserId: string | null;
  userId: string;
}): boolean {
  return (
    Boolean(params.storedState) &&
    Boolean(params.storedUserId) &&
    params.storedState === params.state &&
    params.storedUserId === params.userId
  );
}

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

  const stored = await readWithingsOAuthCookies();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? stored.userId;

  if (
    !userId ||
    !isValidOAuthSession({
      state,
      storedState: stored.state,
      storedUserId: stored.userId,
      userId,
    })
  ) {
    await clearWithingsOAuthCookies();
    return NextResponse.redirect(
      `${profileUrl}?integration_error=${encodeURIComponent("Invalid OAuth session. Try connecting again.")}`
    );
  }

  await clearWithingsOAuthCookies();

  try {
    await completeWithingsOAuth({
      userId,
      code,
      redirectUri: withingsOAuthRedirectUri(),
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
