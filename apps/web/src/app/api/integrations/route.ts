import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import {
  buildIntegrationsHubView,
  listIntegrationStatuses,
} from "@/lib/integrations/service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionForUser(user.id);
  const unlocked = hasFeature(subscription, "device_integrations");

  let integrations = buildIntegrationsHubView([]);
  if (unlocked) {
    try {
      const statuses = await listIntegrationStatuses(user.id);
      integrations = buildIntegrationsHubView(statuses);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load integrations.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({
    unlocked,
    integrations,
  });
}
