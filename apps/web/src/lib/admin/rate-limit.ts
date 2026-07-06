const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limit for admin API routes (per admin user id).
 * Returns true when the request is allowed.
 */
export function checkAdminRateLimit(
  adminUserId: string,
  options?: { limit?: number; windowMs?: number }
): boolean {
  const limit = options?.limit ?? 120;
  const windowMs = options?.windowMs ?? 60_000;
  const now = Date.now();
  const key = adminUserId;
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}

export function adminRateLimitResponse(): Response {
  return new Response(JSON.stringify({ error: "Too many requests." }), {
    status: 429,
    headers: { "Content-Type": "application/json" },
  });
}
