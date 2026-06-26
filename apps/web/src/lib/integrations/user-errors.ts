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

  if (
    lower.includes("invalid_grant") ||
    (lower.includes("expired") && lower.includes("revoked")) ||
    lower.includes("token has been expired")
  ) {
    return (
      "Google revoked ForgeRep’s access to your Fitbit data. Tap Disconnect, then Connect again " +
      "and approve all requested permissions. If it still fails, remove ForgeRep under Google Account " +
      "→ Security → Third-party access, then reconnect."
    );
  }

  if (lower.includes("refresh token")) {
    return (
      "Google did not grant ongoing access. Disconnect here, remove ForgeRep from your Google Account " +
      "(Security → Third-party access), then tap Connect again."
    );
  }

  if (
    lower.includes("invalid authentication credentials") ||
    lower.includes("invalid credentials")
  ) {
    return (
      "Your Fitbit connection needs a fresh sign-in. Tap Sync now once more; if this message persists, " +
      "Disconnect and Connect again."
    );
  }

  if (lower.includes("invalid oauth session")) {
    return "Your connection session expired. Tap Connect and try again.";
  }

  if (
    lower.includes("invalid argument") ||
    lower.includes("request contains an invalid argument")
  ) {
    return (
      "Google Health rejected the sync request. If this keeps happening after reconnecting, " +
      "confirm your Fitbit app is signed in with Google (Continue with Google), then try Sync again."
    );
  }

  if (
    lower.includes("could not mint") ||
    lower.includes("does not have permission") ||
    lower.includes("gaia")
  ) {
    return (
      "This Google account is not fully linked to Fitbit yet. In the Fitbit app, sign out, then sign in " +
      "with Continue with Google using the same account. Complete Fitbit’s move to Google if prompted, " +
      "sync your tracker, then try Connect again."
    );
  }

  return message;
}
