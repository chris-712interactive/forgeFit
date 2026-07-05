import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdminUser } from "@/lib/admin/auth";
import { getPostAuthPath } from "@/lib/auth/post-auth-path";

const MEMBER_PREFIXES = [
  "/home",
  "/workout",
  "/nutrition",
  "/progress",
  "/profile",
  "/exercises",
  "/onboarding",
  "/disclaimer",
  "/evidence",
  "/community",
] as const;

/** Validates a relative in-app redirect path from auth flows. */
export function sanitizeAuthRedirect(
  raw: string | null | undefined
): string | null {
  if (!raw) return null;

  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return null;
  }

  const pathname = path.split("?")[0]?.split("#")[0] ?? path;
  if (!pathname) return null;

  if (pathname.startsWith("/admin")) {
    return pathname === "/admin/login" ? "/admin" : pathname;
  }

  if (
    MEMBER_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return pathname;
  }

  return null;
}

export async function resolveAuthRedirect(
  supabase: SupabaseClient,
  userId: string,
  requested: string | null | undefined
): Promise<string> {
  const sanitized = sanitizeAuthRedirect(requested ?? null);

  if (sanitized?.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();

    if (isAdminUser({ userId, profileFlag: profile?.is_admin })) {
      return sanitized;
    }

    return "/admin/login";
  }

  if (sanitized) {
    return sanitized;
  }

  return getPostAuthPath(supabase, userId);
}
