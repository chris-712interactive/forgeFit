import { createBillingPortalSession } from "@/lib/billing/subscription-management";
import { getSiteUrl } from "@/lib/seo/site-url";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = await createBillingPortalSession(
      user.id,
      `${getSiteUrl()}/profile#subscription`
    );

    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not open billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
