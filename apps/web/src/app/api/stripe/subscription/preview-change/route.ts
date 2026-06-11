import type { BillingInterval } from "@/lib/billing/pricing";
import { previewSubscriptionPlanChange } from "@/lib/billing/subscription-management";
import type { PaidTier } from "@/lib/billing/types";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      tier?: PaidTier;
      interval?: BillingInterval;
    };

    const tier: PaidTier = body.tier === "pro_plus" ? "pro_plus" : "pro";
    const interval =
      body.interval === "annual" || body.interval === "monthly"
        ? body.interval
        : undefined;

    const preview = await previewSubscriptionPlanChange(
      user.id,
      tier,
      interval
    );

    return NextResponse.json(preview);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not preview plan change.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
