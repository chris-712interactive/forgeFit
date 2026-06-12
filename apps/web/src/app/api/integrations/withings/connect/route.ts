import { buildWithingsAuthorizeUrl } from "@forgefit/integrations";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import {
  getWithingsClientConfig,
  isWithingsConfigured,
  withingsRedirectUri,
} from "@/lib/integrations/config";
import { assertDeviceIntegrationsAccess } from "@/lib/integrations/service";
import {
  createWithingsOAuthState,
  setWithingsOAuthCookies,
} from "@/lib/integrations/oauth-state";
import { getSiteUrl } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isWithingsConfigured()) {
    return NextResponse.json(
      { error: "Withings integration is not configured." },
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

  const subscription = await getSubscriptionForUser(user.id);
  try {
    assertDeviceIntegrationsAccess(subscription);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Device integrations require Pro+.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const { clientId } = getWithingsClientConfig();
  const siteUrl = getSiteUrl();
  const redirectUri = withingsRedirectUri(siteUrl);
  const state = createWithingsOAuthState();

  await setWithingsOAuthCookies(state, user.id);

  const authorizeUrl = buildWithingsAuthorizeUrl({
    clientId,
    redirectUri,
    state,
  });

  return NextResponse.redirect(authorizeUrl);
}
