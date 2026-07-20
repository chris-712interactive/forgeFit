import { getStripePriceIds, getStripe } from "@/lib/billing/stripe";
import type { BillingInterval, BillingTier } from "@/lib/billing/pricing";
import {
  PARTNER_REF_COOKIE,
  parsePartnerRefCookie,
} from "@/lib/partners/cookie";
import { getUserAttribution, stampUserAttributionFromRef } from "@/lib/partners/stamp";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/seo/site-url";
import { cookies } from "next/headers";
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
      interval?: BillingInterval;
      tier?: BillingTier;
      partnerCode?: string;
    };
    const interval = body.interval === "annual" ? "annual" : "monthly";
    const tier: BillingTier = body.tier === "pro_plus" ? "pro_plus" : "pro";

    const { userHasActiveStripeSubscription } = await import(
      "@/lib/billing/subscription-management"
    );
    if (await userHasActiveStripeSubscription(user.id)) {
      return NextResponse.json(
        {
          error:
            "You already have an active subscription. Use plan change or cancel instead.",
        },
        { status: 409 }
      );
    }

    const priceIds = getStripePriceIds(tier);
    const stripe = getStripe();
    const siteUrl = getSiteUrl();

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Best-effort: stamp attribution from cookie/code before checkout metadata
    const cookieStore = await cookies();
    const ref = parsePartnerRefCookie(
      cookieStore.get(PARTNER_REF_COOKIE)?.value
    );
    try {
      await stampUserAttributionFromRef({
        userId: user.id,
        ref,
        code: body.partnerCode ?? null,
      });
    } catch (stampError) {
      console.error("[partners] checkout stamp failed:", stampError);
    }

    let attribution: Awaited<ReturnType<typeof getUserAttribution>> = null;
    try {
      attribution = await getUserAttribution(user.id);
    } catch (attrError) {
      console.error("[partners] checkout attribution lookup failed:", attrError);
    }
    const partnerMetadata: Record<string, string> = {};
    if (attribution) {
      partnerMetadata.partner_id = attribution.partnerId;
      partnerMetadata.attribution_id = attribution.id;
      if (attribution.partnerSlug) {
        partnerMetadata.partner_slug = attribution.partnerSlug;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: interval === "annual" ? priceIds.annual : priceIds.monthly,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/profile?checkout=success`,
      cancel_url: `${siteUrl}/profile?checkout=canceled`,
      subscription_data: {
        metadata: { user_id: user.id, tier, ...partnerMetadata },
      },
      metadata: { user_id: user.id, tier, ...partnerMetadata },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Unable to start checkout." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
