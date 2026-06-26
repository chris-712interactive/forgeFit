/** Google OAuth / Google Health API auth failure heuristics. */
export function isGoogleHealthAuthError(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("invalid authentication credentials") ||
    lower.includes("invalid credentials") ||
    lower.includes("invalid_grant") ||
    lower.includes("unauthorized") ||
    (lower.includes("expired") && lower.includes("revoked")) ||
    lower.includes("token has been expired")
  );
}

/** Refresh token is gone — user must reconnect; retrying sync will not help. */
export function isPermanentGoogleAuthError(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("invalid_grant") ||
    (lower.includes("expired") && lower.includes("revoked")) ||
    lower.includes("token has been expired") ||
    lower.includes("refresh token is missing")
  );
}
