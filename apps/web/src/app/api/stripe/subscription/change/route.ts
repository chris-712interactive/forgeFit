import type { BillingInterval } from "@/lib/billing/pricing";
import { changeSubscriptionPlan } from "@/lib/billing/subscription-management";
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
      prorationDate?: number;
    };

    const tier: PaidTier = body.tier === "pro_plus" ? "pro_plus" : "pro";
    const interval =
      body.interval === "annual" || body.interval === "monthly"
        ? body.interval
        : undefined;
    const prorationDate =
      typeof body.prorationDate === "number" ? body.prorationDate : undefined;

    const result = await changeSubscriptionPlan(user.id, tier, interval, {
      prorationDate,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not change subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
