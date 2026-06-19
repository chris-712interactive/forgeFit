import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const MAX_AGE_MS = 10 * 60 * 1000;

function signingKey(): Buffer {
  const secret = process.env.INTEGRATIONS_TOKEN_ENCRYPTION_KEY?.trim();
  if (!secret) {
    throw new Error("INTEGRATIONS_TOKEN_ENCRYPTION_KEY is not configured.");
  }
  return createHmac("sha256", secret).update("integration-oauth-state").digest();
}

/** Signed OAuth state — survives cross-host redirects without cookies. */
export function createSignedIntegrationOAuthState(userId: string): string {
  const nonce = randomBytes(12).toString("base64url");
  const issuedAt = String(Date.now());
  const payload = `${userId}:${nonce}:${issuedAt}`;
  const signature = createHmac("sha256", signingKey())
    .update(payload)
    .digest("base64url");
  return `${payload}:${signature}`;
}

export function verifySignedIntegrationOAuthState(
  state: string
): { userId: string } | null {
  const parts = state.split(":");
  if (parts.length !== 4) return null;

  const [userId, nonce, issuedAt, signature] = parts;
  if (!userId || !nonce || !issuedAt || !signature) return null;

  const issuedAtMs = Number(issuedAt);
  if (!Number.isFinite(issuedAtMs) || Date.now() - issuedAtMs > MAX_AGE_MS) {
    return null;
  }

  const payload = `${userId}:${nonce}:${issuedAt}`;
  const expected = createHmac("sha256", signingKey())
    .update(payload)
    .digest("base64url");

  try {
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return { userId };
}

export function profileIntegrationsRedirectUrl(
  siteUrl: string,
  query?: Record<string, string | undefined>
): string {
  const base = `${siteUrl.replace(/\/$/, "")}/profile`;
  const search = new URLSearchParams();

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value != null && value !== "") {
        search.set(key, value);
      }
    }
  }

  const qs = search.toString();
  return qs ? `${base}?${qs}#integrations` : `${base}#integrations`;
}

export function profileWorkoutMusicRedirectUrl(
  siteUrl: string,
  query?: Record<string, string | undefined>
): string {
  const base = `${siteUrl.replace(/\/$/, "")}/profile`;
  const search = new URLSearchParams();

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value != null && value !== "") {
        search.set(key, value);
      }
    }
  }

  const qs = search.toString();
  return qs ? `${base}?${qs}#workout-music` : `${base}#workout-music`;
}
