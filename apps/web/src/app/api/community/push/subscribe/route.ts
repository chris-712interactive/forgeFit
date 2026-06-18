import { upsertPushSubscription } from "@/lib/coaching/community-push";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("gamification_opt_in")
    .eq("id", user.id)
    .single();

  if (!profile?.gamification_opt_in) {
    return NextResponse.json(
      { error: "Join community before enabling push." },
      { status: 403 }
    );
  }

  let body: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "Subscription endpoint and keys are required." },
      { status: 400 }
    );
  }

  const result = await upsertPushSubscription({
    userId: user.id,
    endpoint,
    p256dh,
    auth,
    userAgent: request.headers.get("user-agent"),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let endpoint: string | undefined;
  try {
    const body = (await request.json()) as { endpoint?: string };
    endpoint = body.endpoint?.trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint required." }, { status: 400 });
  }

  const { removePushSubscription } = await import("@/lib/coaching/community-push");
  const result = await removePushSubscription(user.id, endpoint);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
