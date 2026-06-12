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

export function isDeviceIntegrationsConfigured(): boolean {
  return isWithingsConfigured();
}
