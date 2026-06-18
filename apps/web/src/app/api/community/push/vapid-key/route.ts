import { getVapidPublicKey, isCommunityPushConfigured } from "@/lib/coaching/community-push";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isCommunityPushConfigured()) {
    return NextResponse.json(
      { error: "Push notifications are not configured." },
      { status: 503 }
    );
  }

  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json(
      { error: "VAPID public key missing." },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey });
}
