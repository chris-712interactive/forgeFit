/** Short-lived fallback when Supabase drops `redirectTo` query params. */
export const AUTH_REDIRECT_COOKIE = "forge_auth_redirect";
export const AUTH_REDIRECT_MAX_AGE_SECONDS = 600;

/** Set before OAuth so callback can recover the intended destination. */
export function setAuthRedirectCookie(path: string): void {
  if (typeof document === "undefined") return;

  const encoded = encodeURIComponent(path);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_REDIRECT_COOKIE}=${encoded}; Path=/; Max-Age=${AUTH_REDIRECT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}
