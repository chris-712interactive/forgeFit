import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";

const MAX_AGE_SECONDS = 600;

function integrationCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) return undefined;

  try {
    const hostname = new URL(siteUrl).hostname;
    if (hostname === "localhost" || hostname.endsWith(".localhost")) {
      return undefined;
    }
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join(".")}`;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function integrationCookieOptions() {
  const domain = integrationCookieDomain();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE_SECONDS,
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

async function deleteIntegrationCookie(name: string): Promise<void> {
  const cookieStore = await cookies();
  const domain = integrationCookieDomain();
  if (domain) {
    cookieStore.delete({ name, path: "/", domain });
  }
  cookieStore.delete(name);
}

const STATE_COOKIE = "withings_oauth_state";
const USER_COOKIE = "withings_oauth_uid";

export function createWithingsOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

export async function setWithingsOAuthCookies(
  state: string,
  userId: string
): Promise<void> {
  const cookieStore = await cookies();
  const options = integrationCookieOptions();

  cookieStore.set(STATE_COOKIE, state, options);
  cookieStore.set(USER_COOKIE, userId, options);
}

export async function readWithingsOAuthCookies(): Promise<{
  state: string | null;
  userId: string | null;
}> {
  const cookieStore = await cookies();
  return {
    state: cookieStore.get(STATE_COOKIE)?.value ?? null,
    userId: cookieStore.get(USER_COOKIE)?.value ?? null,
  };
}

export async function clearWithingsOAuthCookies(): Promise<void> {
  await deleteIntegrationCookie(STATE_COOKIE);
  await deleteIntegrationCookie(USER_COOKIE);
}

const FITBIT_STATE_COOKIE = "fitbit_oauth_state";
const FITBIT_USER_COOKIE = "fitbit_oauth_uid";

export function createFitbitOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

export async function setFitbitOAuthCookies(
  state: string,
  userId: string
): Promise<void> {
  const cookieStore = await cookies();
  const options = integrationCookieOptions();

  cookieStore.set(FITBIT_STATE_COOKIE, state, options);
  cookieStore.set(FITBIT_USER_COOKIE, userId, options);
}

export async function readFitbitOAuthCookies(): Promise<{
  state: string | null;
  userId: string | null;
}> {
  const cookieStore = await cookies();
  return {
    state: cookieStore.get(FITBIT_STATE_COOKIE)?.value ?? null,
    userId: cookieStore.get(FITBIT_USER_COOKIE)?.value ?? null,
  };
}

export async function clearFitbitOAuthCookies(): Promise<void> {
  await deleteIntegrationCookie(FITBIT_STATE_COOKIE);
  await deleteIntegrationCookie(FITBIT_USER_COOKIE);
}

const SPOTIFY_VERIFIER_COOKIE = "spotify_oauth_verifier";

export function createSpotifyPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(64).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export async function setSpotifyOAuthVerifierCookie(
  verifier: string
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SPOTIFY_VERIFIER_COOKIE, verifier, integrationCookieOptions());
}

export async function readSpotifyOAuthVerifierCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SPOTIFY_VERIFIER_COOKIE)?.value ?? null;
}

export async function clearSpotifyOAuthCookies(): Promise<void> {
  await deleteIntegrationCookie(SPOTIFY_VERIFIER_COOKIE);
}
