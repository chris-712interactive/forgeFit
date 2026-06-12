import { buildStravaAuthorizeUrl } from "@forgefit/integrations";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import {
  getStravaClientConfig,
  isStravaConfigured,
  stravaOAuthRedirectUri,
} from "@/lib/integrations/config";
import { assertDeviceIntegrationsAccess } from "@/lib/integrations/service";
import { createSignedIntegrationOAuthState } from "@/lib/integrations/oauth-state-token";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isStravaConfigured()) {
    return NextResponse.json(
      { error: "Strava integration is not configured." },
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

  const { clientId } = getStravaClientConfig();
  const redirectUri = stravaOAuthRedirectUri();
  const state = createSignedIntegrationOAuthState(user.id);

  const authorizeUrl = buildStravaAuthorizeUrl({
    clientId,
    redirectUri,
    state,
  });

  return NextResponse.redirect(authorizeUrl);
}
