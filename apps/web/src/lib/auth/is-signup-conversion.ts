import type { User } from "@supabase/supabase-js";

const CONVERSION_WINDOW_MS = 10 * 60 * 1000;

/** True when auth just created or confirmed a new account (OAuth, email confirm, etc.). */
export function isSignupConversion(user: User): boolean {
  const now = Date.now();
  const createdAt = new Date(user.created_at).getTime();

  if (now - createdAt < CONVERSION_WINDOW_MS) {
    return true;
  }

  const confirmedAt = user.confirmed_at
    ? new Date(user.confirmed_at).getTime()
    : null;

  if (confirmedAt && now - confirmedAt < CONVERSION_WINDOW_MS) {
    return true;
  }

  return false;
}

export function withSignupConversionParam(path: string): string {
  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  params.set("signup", "1");
  const query = params.toString();
  return query ? `${pathname}?${query}` : `${pathname}?signup=1`;
}
