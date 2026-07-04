import { estimateE1rmFromSet } from "@/lib/progression/one-rep-max";
import type { CommunityWinRow } from "./types";

const PR_HEADLINE_PREFIX = "New PR — ";

export function parsePrWinMovement(headline: string): string | null {
  if (!headline.startsWith(PR_HEADLINE_PREFIX)) {
    return null;
  }
  const movement = headline.slice(PR_HEADLINE_PREFIX.length).trim();
  return movement.length > 0 ? movement : null;
}

export function parsePrWinDetail(
  detail: string | null
): { reps: number; weightKg: number } | null {
  if (!detail) {
    return null;
  }

  const metric = detail.match(/(\d+(?:\.\d+)?)\s+reps\s+at\s+(\d+(?:\.\d+)?)\s+kg/i);
  if (metric) {
    return { reps: Number(metric[1]), weightKg: Number(metric[2]) };
  }

  const imperial = detail.match(
    /(\d+(?:\.\d+)?)\s+reps\s+at\s+(\d+(?:\.\d+)?)\s+lb/i
  );
  if (imperial) {
    return {
      reps: Number(imperial[1]),
      weightKg: Number(imperial[2]) * 0.45359237,
    };
  }

  return null;
}

export function prWinE1rmKg(detail: string | null): number | null {
  const parsed = parsePrWinDetail(detail);
  if (!parsed) {
    return null;
  }
  return estimateE1rmFromSet(parsed.weightKg, parsed.reps);
}

export function prWinDateKey(occurredAt: string): string {
  return occurredAt.slice(0, 10);
}

export function prWinDedupeKey(
  win: Pick<CommunityWinRow, "userId" | "headline" | "occurredAt">
): string | null {
  const movement = parsePrWinMovement(win.headline);
  if (!movement) {
    return null;
  }
  return `${win.userId}|${movement.toLowerCase()}|${prWinDateKey(win.occurredAt)}`;
}

/** Keep the highest e1rm PR per user, movement, and calendar day (UTC). */
export function dedupeCommunityPrWins<
  T extends Pick<
    CommunityWinRow,
    "id" | "userId" | "winType" | "headline" | "detail" | "occurredAt"
  >,
>(wins: T[]): T[] {
  const bestByKey = new Map<string, T>();
  const ungroupableIds = new Set<string>();

  for (const win of wins) {
    if (win.winType !== "pr") {
      continue;
    }

    const key = prWinDedupeKey(win);
    if (!key) {
      ungroupableIds.add(win.id);
      continue;
    }

    const e1rm = prWinE1rmKg(win.detail);
    if (e1rm == null) {
      ungroupableIds.add(win.id);
      continue;
    }

    const existing = bestByKey.get(key);
    if (!existing) {
      bestByKey.set(key, win);
      continue;
    }

    const existingE1rm = prWinE1rmKg(existing.detail) ?? 0;
    if (e1rm > existingE1rm) {
      bestByKey.set(key, win);
    }
  }

  const keptPrIds = new Set([
    ...Array.from(bestByKey.values()).map((win) => win.id),
    ...ungroupableIds,
  ]);

  return wins.filter((win) => win.winType !== "pr" || keptPrIds.has(win.id));
}

export function buildPrWinHeadline(exerciseLabel: string): string {
  return `${PR_HEADLINE_PREFIX}${exerciseLabel}`;
}
