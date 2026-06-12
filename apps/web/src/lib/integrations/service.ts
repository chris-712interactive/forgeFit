import type { IntegrationProvider } from "@forgefit/integrations";
import {
  exchangeGoogleHealthAuthorizationCode,
  exchangeWithingsAuthorizationCode,
  extractWeightKgFromGroup,
  fetchDailyActivitySummaries,
  fetchGoogleHealthIdentity,
  fetchWithingsMeasures,
  measureGroupToDate,
  refreshGoogleHealthAccessToken,
  refreshWithingsAccessToken,
  todayIsoDate,
  WITHINGS_MEASURE_TYPE_WEIGHT,
} from "@forgefit/integrations";
import { hasFeature } from "@/lib/billing/gates";
import type { SubscriptionSnapshot } from "@/lib/billing/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  decryptIntegrationSecret,
  encryptIntegrationSecret,
} from "./crypto";
import {
  fitbitRedirectUri,
  getGoogleHealthClientConfig,
  getWithingsClientConfig,
  withingsRedirectUri,
} from "./config";
import {
  INTEGRATION_AVAILABLE,
  INTEGRATION_DESCRIPTIONS,
  INTEGRATION_LABELS,
  INTEGRATION_PROVIDERS,
  type IntegrationPublicStatus,
  type UserIntegrationRow,
} from "./types";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const INITIAL_SYNC_LOOKBACK_DAYS = 90;

export function assertDeviceIntegrationsAccess(
  subscription: SubscriptionSnapshot
): void {
  if (!hasFeature(subscription, "device_integrations")) {
    throw new IntegrationAccessError(
      "Device integrations require a Pro+ subscription."
    );
  }
}

export class IntegrationAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntegrationAccessError";
  }
}

export class IntegrationNotConnectedError extends Error {
  constructor(provider: IntegrationProvider) {
    super(`${provider} is not connected.`);
    this.name = "IntegrationNotConnectedError";
  }
}

function rowToPublicStatus(
  provider: IntegrationProvider,
  row: UserIntegrationRow | null
): IntegrationPublicStatus {
  return {
    provider,
    connected: row != null && row.status === "active",
    status: row?.status ?? null,
    externalUserId: row?.external_user_id ?? null,
    lastSyncAt: row?.last_sync_at ?? null,
    lastSyncError: row?.last_sync_error ?? null,
  };
}

export async function listIntegrationStatuses(
  userId: string
): Promise<IntegrationPublicStatus[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_integrations")
    .select(
      "id, user_id, provider, external_user_id, status, last_sync_at, last_sync_error"
    )
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const byProvider = new Map(
    (data ?? []).map((row) => [row.provider as IntegrationProvider, row])
  );

  return INTEGRATION_PROVIDERS.map((provider) =>
    rowToPublicStatus(
      provider,
      (byProvider.get(provider) as UserIntegrationRow | undefined) ?? null
    )
  );
}

export function buildIntegrationsHubView(
  statuses: IntegrationPublicStatus[]
): Array<
  IntegrationPublicStatus & {
    label: string;
    description: string;
    available: boolean;
  }
> {
  return statuses.map((status) => ({
    ...status,
    label: INTEGRATION_LABELS[status.provider],
    description: INTEGRATION_DESCRIPTIONS[status.provider],
    available: INTEGRATION_AVAILABLE[status.provider],
  }));
}

async function getIntegrationRow(
  userId: string,
  provider: IntegrationProvider
): Promise<UserIntegrationRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as UserIntegrationRow | null) ?? null;
}

export async function saveWithingsConnection(params: {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
  externalUserId: string;
}): Promise<void> {
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + params.expiresIn * 1000).toISOString();

  const { error } = await admin.from("user_integrations").upsert(
    {
      user_id: params.userId,
      provider: "withings",
      external_user_id: params.externalUserId,
      access_token_encrypted: encryptIntegrationSecret(params.accessToken),
      refresh_token_encrypted: encryptIntegrationSecret(params.refreshToken),
      token_expires_at: expiresAt,
      scopes: params.scope,
      status: "active",
      last_sync_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function completeWithingsOAuth(params: {
  userId: string;
  code: string;
  redirectUri: string;
}): Promise<void> {
  const { clientId, clientSecret } = getWithingsClientConfig();
  const token = await exchangeWithingsAuthorizationCode({
    clientId,
    clientSecret,
    code: params.code,
    redirectUri: params.redirectUri,
  });

  await saveWithingsConnection({
    userId: params.userId,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresIn: token.expires_in,
    scope: token.scope,
    externalUserId: String(token.userid),
  });

  await syncWithingsForUser(params.userId);
}

export async function disconnectIntegration(
  userId: string,
  provider: IntegrationProvider
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_integrations")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider);

  if (error) {
    throw new Error(error.message);
  }
}

async function getValidWithingsAccessToken(
  row: UserIntegrationRow
): Promise<string> {
  const expiresAt = row.token_expires_at
    ? new Date(row.token_expires_at).getTime()
    : 0;

  if (expiresAt - Date.now() > TOKEN_REFRESH_BUFFER_MS) {
    return decryptIntegrationSecret(row.access_token_encrypted);
  }

  if (!row.refresh_token_encrypted) {
    throw new Error("Withings refresh token is missing.");
  }

  const { clientId, clientSecret } = getWithingsClientConfig();
  const refreshed = await refreshWithingsAccessToken({
    clientId,
    clientSecret,
    refreshToken: decryptIntegrationSecret(row.refresh_token_encrypted),
  });

  const admin = createAdminClient();
  const newExpiresAt = new Date(
    Date.now() + refreshed.expires_in * 1000
  ).toISOString();

  const { error } = await admin
    .from("user_integrations")
    .update({
      access_token_encrypted: encryptIntegrationSecret(refreshed.access_token),
      refresh_token_encrypted: encryptIntegrationSecret(refreshed.refresh_token),
      token_expires_at: newExpiresAt,
      status: "active",
      last_sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) {
    throw new Error(error.message);
  }

  return refreshed.access_token;
}

function syncFromUnix(lastSyncAt: string | null): number {
  if (lastSyncAt) {
    return Math.floor(new Date(lastSyncAt).getTime() / 1000);
  }

  const lookbackMs = INITIAL_SYNC_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - lookbackMs) / 1000);
}

export interface WithingsSyncResult {
  imported: number;
  skipped: number;
  latestWeightKg: number | null;
}

export async function syncWithingsForUser(
  userId: string
): Promise<WithingsSyncResult> {
  const row = await getIntegrationRow(userId, "withings");
  if (!row || row.status === "revoked") {
    throw new IntegrationNotConnectedError("withings");
  }

  const admin = createAdminClient();

  try {
    const accessToken = await getValidWithingsAccessToken(row);
    const groups = await fetchWithingsMeasures({
      accessToken,
      fromUnix: syncFromUnix(row.last_sync_at),
      meastypes: [WITHINGS_MEASURE_TYPE_WEIGHT],
    });

    const byDate = new Map<string, { weightKg: number; timestamp: number }>();
    for (const group of groups) {
      const weightKg = extractWeightKgFromGroup(group);
      if (weightKg == null) continue;
      const date = measureGroupToDate(group);
      const existing = byDate.get(date);
      if (!existing || group.date > existing.timestamp) {
        byDate.set(date, { weightKg, timestamp: group.date });
      }
    }

    let imported = 0;
    let skipped = 0;
    let latestDate: string | null = null;
    let latestWeightKg: number | null = null;

    for (const [measuredDate, { weightKg }] of [...byDate.entries()].sort(
      ([a], [b]) => a.localeCompare(b)
    )) {
      const { data: existing } = await admin
        .from("body_measurements")
        .select("*")
        .eq("user_id", userId)
        .eq("measured_date", measuredDate)
        .maybeSingle();

      if (
        existing?.weight_kg != null &&
        Math.abs(Number(existing.weight_kg) - weightKg) < 0.05
      ) {
        skipped += 1;
        if (latestDate == null || measuredDate > latestDate) {
          latestDate = measuredDate;
          latestWeightKg = Number(existing.weight_kg);
        }
        continue;
      }

      const { error: upsertError } = await admin.from("body_measurements").upsert(
        {
          user_id: userId,
          measured_date: measuredDate,
          weight_kg: weightKg,
          waist_cm: existing?.waist_cm ?? null,
          chest_cm: existing?.chest_cm ?? null,
          arms_cm: existing?.arms_cm ?? null,
          legs_cm: existing?.legs_cm ?? null,
          neck_cm: existing?.neck_cm ?? null,
          hips_cm: existing?.hips_cm ?? null,
          body_fat_pct: existing?.body_fat_pct ?? null,
          notes: existing?.notes ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,measured_date" }
      );

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      imported += 1;

      if (latestDate == null || measuredDate > latestDate) {
        latestDate = measuredDate;
        latestWeightKg = weightKg;
      }
    }

    if (latestWeightKg != null) {
      await admin
        .from("profiles")
        .update({ weight_kg: latestWeightKg })
        .eq("id", userId);
    }

    const now = new Date().toISOString();
    await admin
      .from("user_integrations")
      .update({
        status: "active",
        last_sync_at: now,
        last_sync_error: null,
        updated_at: now,
      })
      .eq("id", row.id);

    return { imported, skipped, latestWeightKg };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Withings sync failed.";
    await admin
      .from("user_integrations")
      .update({
        status: "error",
        last_sync_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    throw error;
  }
}

export async function saveFitbitConnection(params: {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
  externalUserId: string;
}): Promise<void> {
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + params.expiresIn * 1000).toISOString();

  const { error } = await admin.from("user_integrations").upsert(
    {
      user_id: params.userId,
      provider: "fitbit",
      external_user_id: params.externalUserId,
      access_token_encrypted: encryptIntegrationSecret(params.accessToken),
      refresh_token_encrypted: encryptIntegrationSecret(params.refreshToken),
      token_expires_at: expiresAt,
      scopes: params.scope,
      status: "active",
      last_sync_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function completeFitbitOAuth(params: {
  userId: string;
  code: string;
  redirectUri: string;
}): Promise<void> {
  const { clientId, clientSecret } = getGoogleHealthClientConfig();
  const token = await exchangeGoogleHealthAuthorizationCode({
    clientId,
    clientSecret,
    code: params.code,
    redirectUri: params.redirectUri,
  });

  if (!token.refresh_token) {
    throw new Error(
      "Google did not return a refresh token. Disconnect in your Google account and try again."
    );
  }

  const identity = await fetchGoogleHealthIdentity(token.access_token);
  const externalUserId =
    identity.healthUserId ?? identity.legacyUserId ?? params.userId;

  await saveFitbitConnection({
    userId: params.userId,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresIn: token.expires_in,
    scope: token.scope,
    externalUserId,
  });

  await syncFitbitForUser(params.userId);
}

async function getValidFitbitAccessToken(
  row: UserIntegrationRow
): Promise<string> {
  const expiresAt = row.token_expires_at
    ? new Date(row.token_expires_at).getTime()
    : 0;

  if (expiresAt - Date.now() > TOKEN_REFRESH_BUFFER_MS) {
    return decryptIntegrationSecret(row.access_token_encrypted);
  }

  if (!row.refresh_token_encrypted) {
    throw new Error("Fitbit refresh token is missing.");
  }

  const { clientId, clientSecret } = getGoogleHealthClientConfig();
  const refreshed = await refreshGoogleHealthAccessToken({
    clientId,
    clientSecret,
    refreshToken: decryptIntegrationSecret(row.refresh_token_encrypted),
  });

  const admin = createAdminClient();
  const newExpiresAt = new Date(
    Date.now() + refreshed.expires_in * 1000
  ).toISOString();

  const { error } = await admin
    .from("user_integrations")
    .update({
      access_token_encrypted: encryptIntegrationSecret(refreshed.access_token),
      refresh_token_encrypted: refreshed.refresh_token
        ? encryptIntegrationSecret(refreshed.refresh_token)
        : row.refresh_token_encrypted,
      token_expires_at: newExpiresAt,
      status: "active",
      last_sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) {
    throw new Error(error.message);
  }

  return refreshed.access_token;
}

function syncFromIsoDate(lastSyncAt: string | null): string {
  if (lastSyncAt) {
    return lastSyncAt.slice(0, 10);
  }

  const lookbackMs = INITIAL_SYNC_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - lookbackMs).toISOString().slice(0, 10);
}

export interface FitbitSyncResult {
  imported: number;
  skipped: number;
  latestDate: string | null;
}

export async function syncFitbitForUser(
  userId: string
): Promise<FitbitSyncResult> {
  const row = await getIntegrationRow(userId, "fitbit");
  if (!row || row.status === "revoked") {
    throw new IntegrationNotConnectedError("fitbit");
  }

  const admin = createAdminClient();

  try {
    const accessToken = await getValidFitbitAccessToken(row);
    const startDate = syncFromIsoDate(row.last_sync_at);
    const endDate = todayIsoDate();

    const summaries = await fetchDailyActivitySummaries({
      accessToken,
      startDate,
      endDate,
    });

    let imported = 0;
    let skipped = 0;
    let latestDate: string | null = null;

    for (const summary of summaries) {
      if (
        summary.steps == null &&
        summary.activeCalories == null &&
        summary.activeMinutes == null
      ) {
        continue;
      }

      const { data: existing } = await admin
        .from("daily_activity_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("activity_date", summary.date)
        .maybeSingle();

      const unchanged =
        existing &&
        (existing.steps ?? null) === summary.steps &&
        Number(existing.active_calories ?? null) === summary.activeCalories &&
        (existing.active_minutes ?? null) === summary.activeMinutes;

      if (unchanged) {
        skipped += 1;
        if (latestDate == null || summary.date > latestDate) {
          latestDate = summary.date;
        }
        continue;
      }

      const { error: upsertError } = await admin.from("daily_activity_logs").upsert(
        {
          user_id: userId,
          activity_date: summary.date,
          steps: summary.steps,
          active_calories: summary.activeCalories,
          active_minutes: summary.activeMinutes,
          source: "fitbit",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,activity_date" }
      );

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      imported += 1;
      if (latestDate == null || summary.date > latestDate) {
        latestDate = summary.date;
      }
    }

    const now = new Date().toISOString();
    await admin
      .from("user_integrations")
      .update({
        status: "active",
        last_sync_at: now,
        last_sync_error: null,
        updated_at: now,
      })
      .eq("id", row.id);

    return { imported, skipped, latestDate };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Fitbit sync failed.";
    await admin
      .from("user_integrations")
      .update({
        status: "error",
        last_sync_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    throw error;
  }
}
