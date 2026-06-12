import { buildWithingsAuthorizeUrl } from "@forgefit/integrations";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import {
  getWithingsClientConfig,
  isWithingsConfigured,
  withingsOAuthRedirectUri,
} from "@/lib/integrations/config";
import { assertDeviceIntegrationsAccess } from "@/lib/integrations/service";
import { setWithingsOAuthCookies } from "@/lib/integrations/oauth-state";
import { createSignedIntegrationOAuthState } from "@/lib/integrations/oauth-state-token";
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
  const redirectUri = withingsOAuthRedirectUri();
  const state = createSignedIntegrationOAuthState(user.id);

  await setWithingsOAuthCookies(state, user.id);

  const authorizeUrl = buildWithingsAuthorizeUrl({
    clientId,
    redirectUri,
    state,
  });

  return NextResponse.redirect(authorizeUrl);
}
