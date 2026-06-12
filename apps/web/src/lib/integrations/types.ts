import type { IntegrationProvider } from "@forgefit/integrations";

export type IntegrationStatus = "active" | "revoked" | "error";

export interface IntegrationPublicStatus {
  provider: IntegrationProvider;
  connected: boolean;
  status: IntegrationStatus | null;
  externalUserId: string | null;
  lastSyncAt: string | null;
  lastSyncError: string | null;
}

export interface UserIntegrationRow {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  external_user_id: string | null;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  scopes: string | null;
  status: IntegrationStatus;
  last_sync_at: string | null;
  last_sync_error: string | null;
}

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  "withings",
  "fitbit",
  "strava",
];

export const INTEGRATION_LABELS: Record<IntegrationProvider, string> = {
  withings: "Withings",
  fitbit: "Fitbit",
  strava: "Strava",
};

export const INTEGRATION_DESCRIPTIONS: Record<IntegrationProvider, string> = {
  withings: "Sync weight from your Withings scale to Progress. Coming soon.",
  fitbit: "Import daily steps and active calories via Google Health (Fitbit).",
  strava: "Sync cardio workouts and training load. Coming soon.",
};

/** Providers with a live Connect flow in Profile → Integrations. */
export const INTEGRATION_AVAILABLE: Record<IntegrationProvider, boolean> = {
  withings: false,
  fitbit: true,
  strava: false,
};
