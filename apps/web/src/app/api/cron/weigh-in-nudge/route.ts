import { sendWeeklyWeighInNudges } from "@/lib/coaching/progress-push";
import { verifyCronSecret } from "@/lib/integrations/fitbit-sync-scheduler";
import { NextResponse } from "next/server";

export const maxDuration = 300;

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
    const summary = await sendWeeklyWeighInNudges();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Weigh-in push cron failed.";
    console.error("[cron/weigh-in-nudge]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
