import {
  buildSubscriptionExportRows,
  subscriptionRowsToCsv,
} from "@/lib/admin/export-subscriptions";
import { getAdminApiActor } from "@/lib/admin/auth";
import {
  adminRateLimitResponse,
  checkAdminRateLimit,
} from "@/lib/admin/rate-limit";

export async function GET() {
  const actor = await getAdminApiActor();
  if (!actor) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!checkAdminRateLimit(actor.userId, { limit: 30, windowMs: 60_000 })) {
    return adminRateLimitResponse();
  }

  const rows = await buildSubscriptionExportRows();
  const csv = subscriptionRowsToCsv(rows);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="forgerep-subscriptions-${date}.csv"`,
    },
  });
}
