import { hasFeature } from "@/lib/billing/gates";
import type { SubscriptionSnapshot } from "@/lib/billing/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { isGoogleHealthConfigured } from "./config";
import {
  hasIncompleteActivityLogs,
  hasMissingSleepLogs,
  IntegrationNotConnectedError,
  listIntegrationStatuses,
  syncFitbitForUser,
  type FitbitSyncResult,
} from "./service";

/** Min time between background syncs on Home / Profile visit. */
export const FITBIT_VISIT_SYNC_STALE_MS = 6 * 60 * 60 * 1000;

export function isFitbitSyncStale(
  lastSyncAt: string | null,
  force = false
): boolean {
  if (force) return true;
  if (!lastSyncAt) return true;
  return (
    Date.now() - new Date(lastSyncAt).getTime() >= FITBIT_VISIT_SYNC_STALE_MS
  );
}

export interface FitbitBackgroundSyncOutcome {
  synced: boolean;
  skipped: boolean;
  reason?: string;
  result?: FitbitSyncResult;
  error?: string;
}

/**
 * Sync Fitbit activity when stale (or forced). Used on Home / Profile visits
 * and by the daily cron job.
 */
export async function maybeSyncFitbitForUser(
  userId: string,
  subscription: SubscriptionSnapshot,
  options?: { force?: boolean }
): Promise<FitbitBackgroundSyncOutcome> {
  if (!isGoogleHealthConfigured()) {
    return { synced: false, skipped: true, reason: "not_configured" };
  }

  if (!hasFeature(subscription, "device_integrations")) {
    return { synced: false, skipped: true, reason: "tier" };
  }

  let fitbitConnected = false;
  let lastSyncAt: string | null = null;

  try {
    const statuses = await listIntegrationStatuses(userId);
    const fitbit = statuses.find((status) => status.provider === "fitbit");
    fitbitConnected = fitbit?.connected ?? false;
    lastSyncAt = fitbit?.lastSyncAt ?? null;
  } catch {
    return { synced: false, skipped: true, reason: "status_unavailable" };
  }

  if (!fitbitConnected) {
    return { synced: false, skipped: true, reason: "not_connected" };
  }

  const needsBackfill =
    (await hasIncompleteActivityLogs(userId)) ||
    (await hasMissingSleepLogs(userId));

  if (!isFitbitSyncStale(lastSyncAt, options?.force || needsBackfill)) {
    return { synced: false, skipped: true, reason: "fresh" };
  }

  try {
    const result = await syncFitbitForUser(userId);
    return { synced: true, skipped: false, result };
  } catch (error) {
    if (error instanceof IntegrationNotConnectedError) {
      return { synced: false, skipped: true, reason: "not_connected" };
    }

    const message =
      error instanceof Error ? error.message : "Fitbit sync failed.";
    return { synced: false, skipped: false, error: message };
  }
}

export interface FitbitCronSyncSummary {
  attempted: number;
  synced: number;
  skipped: number;
  failed: number;
  failures: Array<{ userId: string; error: string }>;
}

async function getSubscriptionForUserAdmin(
  userId: string
): Promise<SubscriptionSnapshot> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select(
      "subscription_tier, subscription_status, subscription_current_period_end, subscription_cancel_at_period_end"
    )
    .eq("id", userId)
    .single();

  return {
    tier: (data?.subscription_tier as SubscriptionSnapshot["tier"]) ?? "free",
    status:
      (data?.subscription_status as SubscriptionSnapshot["status"]) ??
      "inactive",
    currentPeriodEnd: data?.subscription_current_period_end ?? null,
    cancelAtPeriodEnd: data?.subscription_cancel_at_period_end ?? false,
  };
}

async function listFitbitUserIdsForCron(): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_integrations")
    .select("user_id")
    .eq("provider", "fitbit")
    .in("status", ["active", "error"]);

  if (error) {
    throw new Error(error.message);
  }

  return [...new Set((data ?? []).map((row) => row.user_id as string))];
}

/** Daily cron — sync every connected Fitbit user with an active Pro+ tier. */
export async function syncAllConnectedFitbitUsers(): Promise<FitbitCronSyncSummary> {
  if (!isGoogleHealthConfigured()) {
    return {
      attempted: 0,
      synced: 0,
      skipped: 0,
      failed: 0,
      failures: [],
    };
  }

  const userIds = await listFitbitUserIdsForCron();
  const summary: FitbitCronSyncSummary = {
    attempted: userIds.length,
    synced: 0,
    skipped: 0,
    failed: 0,
    failures: [],
  };

  for (const userId of userIds) {
    const subscription = await getSubscriptionForUserAdmin(userId);
    const outcome = await maybeSyncFitbitForUser(userId, subscription, {
      force: true,
    });

    if (outcome.synced) {
      summary.synced += 1;
    } else if (outcome.error) {
      summary.failed += 1;
      summary.failures.push({ userId, error: outcome.error });
    } else {
      summary.skipped += 1;
    }
  }

  return summary;
}

export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authorization = request.headers.get("authorization");
  if (authorization === `Bearer ${secret}`) {
    return true;
  }

  return request.headers.get("x-cron-secret") === secret;
}
