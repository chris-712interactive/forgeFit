import { cancelSubscription } from "@/lib/billing/subscription-management";
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

    const body = (await request.json()) as { immediate?: boolean };
    const result = await cancelSubscription(user.id, {
      immediate: body.immediate === true,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not cancel subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
