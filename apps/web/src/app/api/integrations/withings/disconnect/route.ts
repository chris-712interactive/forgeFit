import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import {
  assertDeviceIntegrationsAccess,
  disconnectIntegration,
} from "@/lib/integrations/service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionForUser(user.id);
  if (!hasFeature(subscription, "device_integrations")) {
    return NextResponse.json(
      { error: "Device integrations require a Pro+ subscription." },
      { status: 403 }
    );
  }

  try {
    await disconnectIntegration(user.id, "withings");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not disconnect Withings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ disconnected: true });
}
