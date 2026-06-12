import { randomBytes } from "crypto";
import { cookies } from "next/headers";

const STATE_COOKIE = "withings_oauth_state";
const USER_COOKIE = "withings_oauth_uid";
const MAX_AGE_SECONDS = 600;

export function createWithingsOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

export async function setWithingsOAuthCookies(
  state: string,
  userId: string
): Promise<void> {
  const cookieStore = await cookies();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  };

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
  const cookieStore = await cookies();
  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(USER_COOKIE);
}
