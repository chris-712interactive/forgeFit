/** Map provider/API errors to actionable copy for Profile → Integrations. */
export function formatIntegrationErrorForUser(raw: string): string {
  const message = raw.trim();
  const lower = message.toLowerCase();

  if (
    lower.includes("not linked to google health") ||
    lower.includes("account is not linked")
  ) {
    return (
      "This Google account is not linked to Fitbit yet. Open the Fitbit app on your phone, " +
      "sign in with this same Google account, and complete Fitbit’s move to Google if prompted. " +
      "Sync your tracker in the Fitbit app, then try Connect again here."
    );
  }

  if (lower.includes("refresh token")) {
    return (
      "Google did not grant ongoing access. Remove ForgeRep from your Google Account " +
      "permissions (Security → Third-party access), then try Connect again."
    );
  }

  if (lower.includes("invalid oauth session")) {
    return "Your connection session expired. Tap Connect and try again.";
  }

  return message;
}
