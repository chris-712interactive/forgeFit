/** Allow same-origin in-app paths only (no open redirects). */
export function sanitizeReturnTo(value: string | undefined | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("://")) return null;
  return value;
}
