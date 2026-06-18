/** Pure formatting helpers — safe to import from Client Components. */

export function recoveryMidpoint(
  min: number | null | undefined,
  max: number | null | undefined
): number | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return Math.round((min + max) / 2);
  return min ?? max ?? null;
}

export function formatRestingHr(bpm: number | null | undefined): string {
  if (bpm == null || bpm <= 0) return "—";
  return `${Math.round(bpm)} bpm`;
}

export function formatHrvMs(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) return "—";
  return `${Math.round(ms)} ms`;
}
