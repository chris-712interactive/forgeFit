import { buildGoogleHealthAuthorizeUrl } from "@forgefit/integrations";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import {
  fitbitOAuthRedirectUri,
  getGoogleHealthClientConfig,
  isGoogleHealthConfigured,
} from "@/lib/integrations/config";
import { assertDeviceIntegrationsAccess } from "@/lib/integrations/service";
import {
  createFitbitOAuthState,
  setFitbitOAuthCookies,
} from "@/lib/integrations/oauth-state";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isGoogleHealthConfigured()) {
    return NextResponse.json(
      { error: "Fitbit (Google Health) integration is not configured." },
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

  const { clientId } = getGoogleHealthClientConfig();
  const redirectUri = fitbitOAuthRedirectUri();
  const state = createFitbitOAuthState();

  await setFitbitOAuthCookies(state, user.id);

  const authorizeUrl = buildGoogleHealthAuthorizeUrl({
    clientId,
    redirectUri,
    state,
    prompt: "consent",
  });

  return NextResponse.redirect(authorizeUrl);
}
