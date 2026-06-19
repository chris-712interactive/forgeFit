import { processSeasonRollover } from "@/lib/coaching/community-leagues";
import { verifyCronSecret } from "@/lib/integrations/fitbit-sync-scheduler";
import { NextResponse } from "next/server";

export const maxDuration = 300;

/** Runs on the 1st of each month — finalize prior season, promote/relegate, HOF. */
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

  try {
    const summary = await processSeasonRollover();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Season rollover cron failed.";
    console.error("[cron/community-season-rollover]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
