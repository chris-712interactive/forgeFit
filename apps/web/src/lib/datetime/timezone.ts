import { cookies } from "next/headers";
import { isValidTimeZone } from "./local-date";

export const TIMEZONE_COOKIE = "forge-timezone";
export const TIMEZONE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function getUserTimeZone(): Promise<string> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(TIMEZONE_COOKIE)?.value;
  if (!raw) return "UTC";

  const decoded = decodeURIComponent(raw);
  return isValidTimeZone(decoded) ? decoded : "UTC";
}
