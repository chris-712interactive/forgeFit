import { getSubscriptionForUser } from "@/lib/billing/subscription";
import {
  assertDeviceIntegrationsAccess,
  IntegrationNotConnectedError,
  syncWithingsForUser,
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
  try {
    assertDeviceIntegrationsAccess(subscription);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Device integrations require Pro+.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  try {
    const result = await syncWithingsForUser(user.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof IntegrationNotConnectedError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message =
      error instanceof Error ? error.message : "Withings sync failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
