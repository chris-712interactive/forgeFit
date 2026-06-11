/** Maps logged RIR to the same Easy / Good / Hard labels shown in the workout UI. */
export function effortLabelFromRir(
  rir: number | null | undefined
): "easy" | "good" | "hard" | null {
  if (rir == null) return null;
  if (rir >= 3) return "easy";
  if (rir >= 1) return "good";
  return "hard";
}

export function enrichSetWithEffort<T extends { rir?: number | null }>(
  set: T
): T & { effort: "easy" | "good" | "hard" | null } {
  const rir = set.rir ?? null;
  return {
    ...set,
    effort: effortLabelFromRir(rir),
  };
}
