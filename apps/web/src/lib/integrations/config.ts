import { getSiteUrl } from "@/lib/seo/site-url";

export function isWithingsConfigured(): boolean {
  return Boolean(
    process.env.WITHINGS_CLIENT_ID?.trim() &&
      process.env.WITHINGS_CLIENT_SECRET?.trim() &&
      process.env.INTEGRATIONS_TOKEN_ENCRYPTION_KEY?.trim()
  );
}

export function getWithingsClientConfig() {
  const clientId = process.env.WITHINGS_CLIENT_ID?.trim();
  const clientSecret = process.env.WITHINGS_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Withings OAuth is not configured.");
  }

  return { clientId, clientSecret };
}

export function withingsRedirectUri(siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}/api/integrations/withings/callback`;
}

/** Google Health API OAuth — current Fitbit data path (not legacy fitbit.com OAuth). */
export function isGoogleHealthConfigured(): boolean {
  return Boolean(
    getGoogleHealthClientId() &&
      getGoogleHealthClientSecret() &&
      process.env.INTEGRATIONS_TOKEN_ENCRYPTION_KEY?.trim()
  );
}

function getGoogleHealthClientId(): string | undefined {
  return (
    process.env.GOOGLE_HEALTH_CLIENT_ID?.trim() ||
    process.env.FITBIT_CLIENT_ID?.trim()
  );
}

function getGoogleHealthClientSecret(): string | undefined {
  return (
    process.env.GOOGLE_HEALTH_CLIENT_SECRET?.trim() ||
    process.env.FITBIT_CLIENT_SECRET?.trim()
  );
}

export function getGoogleHealthClientConfig() {
  const clientId = getGoogleHealthClientId();
  const clientSecret = getGoogleHealthClientSecret();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google Health (Fitbit) OAuth is not configured. Set GOOGLE_HEALTH_CLIENT_ID and GOOGLE_HEALTH_CLIENT_SECRET."
    );
  }

  return { clientId, clientSecret };
}

export function fitbitRedirectUri(siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}/api/integrations/fitbit/callback`;
}

/** Canonical OAuth redirect — must match Google Cloud authorized redirect URIs exactly. */
export function fitbitOAuthRedirectUri(): string {
  const override = process.env.INTEGRATION_OAUTH_REDIRECT_URI?.trim();
  if (override) {
    return override.replace(/\/$/, "");
  }
  return fitbitRedirectUri(getSiteUrl());
}

export function withingsOAuthRedirectUri(): string {
  return withingsRedirectUri(getSiteUrl());
}

export function stravaRedirectUri(siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}/api/integrations/strava/callback`;
}

export function stravaOAuthRedirectUri(): string {
  return stravaRedirectUri(getSiteUrl());
}

export function isStravaConfigured(): boolean {
  return Boolean(
    process.env.STRAVA_CLIENT_ID?.trim() &&
      process.env.STRAVA_CLIENT_SECRET?.trim() &&
      process.env.INTEGRATIONS_TOKEN_ENCRYPTION_KEY?.trim()
  );
}

export function getStravaClientConfig() {
  const clientId = process.env.STRAVA_CLIENT_ID?.trim();
  const clientSecret = process.env.STRAVA_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Strava OAuth is not configured.");
  }

  return { clientId, clientSecret };
}

/** @deprecated Prefer fitbitOAuthRedirectUri — request origin breaks Google redirect_uri matching. */
export function getRequestOrigin(request: Request): string {
  return new URL(request.url).origin;
}

/** @deprecated Use fitbitOAuthRedirectUri instead. */
export function fitbitRedirectUriFromRequest(request: Request): string {
  return fitbitRedirectUri(getRequestOrigin(request));
}

/** @deprecated Use withingsOAuthRedirectUri instead. */
export function withingsRedirectUriFromRequest(request: Request): string {
  return withingsRedirectUri(getRequestOrigin(request));
}

export function isDeviceIntegrationsConfigured(): boolean {
  return (
    isWithingsConfigured() || isGoogleHealthConfigured() || isStravaConfigured()
  );
}

/** True when Fitbit / Google Health connect flow can run in this environment. */
export function isFitbitIntegrationConfigured(): boolean {
  return isGoogleHealthConfigured();
}

export function isStravaIntegrationConfigured(): boolean {
  return isStravaConfigured();
}

export function isSpotifyConfigured(): boolean {
  return Boolean(
    process.env.SPOTIFY_CLIENT_ID?.trim() &&
      process.env.SPOTIFY_CLIENT_SECRET?.trim() &&
      process.env.INTEGRATIONS_TOKEN_ENCRYPTION_KEY?.trim()
  );
}

export function getSpotifyClientConfig() {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Spotify OAuth is not configured.");
  }

  return { clientId, clientSecret };
}

export function spotifyRedirectUri(siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}/api/integrations/spotify/callback`;
}

/**
 * Redirect URI sent to Spotify — must match the Spotify Developer Dashboard exactly.
 * Priority: SPOTIFY_OAUTH_REDIRECT_URI → request origin (local dev only) → NEXT_PUBLIC_SITE_URL
 */
export function spotifyOAuthRedirectUri(request?: Request): string {
  const explicit = process.env.SPOTIFY_OAUTH_REDIRECT_URI?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  // Local dev: NEXT_PUBLIC_SITE_URL is often production while testing on localhost
  if (request && process.env.NODE_ENV !== "production") {
    return spotifyRedirectUri(new URL(request.url).origin);
  }

  // Production: always canonical site URL (same pattern as fitbitOAuthRedirectUri)
  return spotifyRedirectUri(getSiteUrl());
}
