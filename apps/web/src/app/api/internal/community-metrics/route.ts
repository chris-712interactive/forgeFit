import { getCommunityMetrics } from "@/lib/coaching/community-metrics";
import { verifyCronSecret } from "@/lib/integrations/fitbit-sync-scheduler";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 }
    );
  }

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metrics = await getCommunityMetrics();
  if (!metrics) {
    return NextResponse.json(
      { error: "Could not load community metrics." },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, metrics });
}
