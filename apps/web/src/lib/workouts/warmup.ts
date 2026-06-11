import { buildEvidenceHref } from "@/lib/evidence/present";
import type { WarmupBlock } from "@forgefit/program-engine";

export type WarmupStatus = "pending" | "completed" | "skipped";

export function formatWarmupDuration(minutes: number): string {
  return minutes === 1 ? "1 min" : `${minutes} min`;
}

export function warmupEvidenceHref(): string {
  return buildEvidenceHref({ focus: "warm_up_sets" });
}

export function warmupMinutesLogged(input: {
  warmupStatus?: WarmupStatus | "completed" | "skipped" | null;
  warmupDurationMs?: number | null;
  warmupBlock?: Pick<WarmupBlock, "durationMinutes"> | null;
  plannedWarmupMinutes?: number | null;
}): number {
  if (input.warmupStatus !== "completed") return 0;

  if (input.warmupDurationMs != null && input.warmupDurationMs > 0) {
    return Math.max(1, Math.round(input.warmupDurationMs / 60_000));
  }

  return (
    input.warmupBlock?.durationMinutes ?? input.plannedWarmupMinutes ?? 0
  );
}
