import { NextResponse } from "next/server";
import type { BroadcastSegment } from "@/lib/admin/broadcast-segments";
import {
  previewBroadcastCount,
  sendAdminBroadcast,
} from "@/lib/admin/broadcast";
import { getAdminApiActor } from "@/lib/admin/auth";
import {
  adminRateLimitResponse,
  checkAdminRateLimit,
} from "@/lib/admin/rate-limit";

const SEGMENTS = new Set<BroadcastSegment>([
  "all_users",
  "paid_users",
  "free_users",
  "pro_users",
  "pro_plus_users",
  "community_opt_in",
  "onboarding_incomplete",
]);

export async function GET(request: Request) {
  const actor = await getAdminApiActor();
  if (!actor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const segment = new URL(request.url).searchParams.get(
    "segment"
  ) as BroadcastSegment | null;

  if (!segment || !SEGMENTS.has(segment)) {
    return NextResponse.json({ error: "Invalid segment." }, { status: 400 });
  }

  const count = await previewBroadcastCount(segment);
  return NextResponse.json({ count, max: 500 });
}

interface BroadcastBody {
  segment?: BroadcastSegment;
  channel?: "email" | "push" | "both";
  subject?: string;
  body?: string;
  url?: string;
  reason?: string;
}

export async function POST(request: Request) {
  const actor = await getAdminApiActor();
  if (!actor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!checkAdminRateLimit(actor.userId, { limit: 10, windowMs: 60_000 })) {
    return adminRateLimitResponse();
  }

  let body: BroadcastBody;
  try {
    body = (await request.json()) as BroadcastBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.segment || !SEGMENTS.has(body.segment)) {
    return NextResponse.json({ error: "Invalid segment." }, { status: 400 });
  }

  if (
    body.channel !== "email" &&
    body.channel !== "push" &&
    body.channel !== "both"
  ) {
    return NextResponse.json({ error: "Invalid channel." }, { status: 400 });
  }

  const result = await sendAdminBroadcast({
    adminUserId: actor.userId,
    segment: body.segment,
    channel: body.channel,
    subject: body.subject ?? "",
    body: body.body ?? "",
    url: body.url,
    reason: body.reason ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
