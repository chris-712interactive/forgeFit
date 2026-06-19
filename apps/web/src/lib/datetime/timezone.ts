import { cookies } from "next/headers";
import { isValidTimeZone } from "./local-date";
import { TIMEZONE_COOKIE } from "./timezone-cookie";

export { TIMEZONE_COOKIE, TIMEZONE_COOKIE_MAX_AGE } from "./timezone-cookie";

export async function getUserTimeZone(): Promise<string> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(TIMEZONE_COOKIE)?.value;
  if (!raw) return "UTC";

  const decoded = decodeURIComponent(raw);
  return isValidTimeZone(decoded) ? decoded : "UTC";
}
