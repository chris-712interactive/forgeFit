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

/** Match redirect_uri to the host that started OAuth (avoids www vs apex cookie loss). */
export function getRequestOrigin(request: Request): string {
  return new URL(request.url).origin;
}

export function fitbitRedirectUriFromRequest(request: Request): string {
  return fitbitRedirectUri(getRequestOrigin(request));
}

export function withingsRedirectUriFromRequest(request: Request): string {
  return withingsRedirectUri(getRequestOrigin(request));
}

export function isDeviceIntegrationsConfigured(): boolean {
  return isWithingsConfigured() || isGoogleHealthConfigured();
}

/** True when Fitbit / Google Health connect flow can run in this environment. */
export function isFitbitIntegrationConfigured(): boolean {
  return isGoogleHealthConfigured();
}
