import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/billing/stripe";
import { syncLatestSubscriptionForCustomer } from "@/lib/billing/sync-subscription";
import { NextResponse } from "next/server";

/** Pull the latest active Stripe subscription into profiles (checkout success fallback). */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer on file yet." },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    const result = await syncLatestSubscriptionForCustomer(
      profile.stripe_customer_id,
      stripe
    );

    if (!result.synced) {
      return NextResponse.json(
        { synced: false, reason: result.reason },
        { status: 404 }
      );
    }

    return NextResponse.json({
      synced: true,
      tier: result.tier,
      status: result.status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Subscription sync failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
