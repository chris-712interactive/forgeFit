import "server-only";
import { cookies } from "next/headers";
import { AUTH_REDIRECT_COOKIE } from "@/lib/auth/redirect-cookie";

/** Read and clear the stored post-auth path (server-only). */
export async function consumeAuthRedirectCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_REDIRECT_COOKIE)?.value;

  cookieStore.delete(AUTH_REDIRECT_COOKIE);

  if (!raw) return null;

  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}
