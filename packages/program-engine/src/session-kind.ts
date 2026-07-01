import type { SessionTemplate } from "./splits";

/** Normalized session focus for back-to-back avoidance on regenerate. */
export function sessionKind(sessionName: string): string {
  const lower = sessionName.toLowerCase();

  if (lower.includes("lower") || lower.startsWith("legs")) return "lower";
  if (lower.includes("upper")) return "upper";
  if (lower.includes("push")) return "push";
  if (lower.includes("pull")) return "pull";
  if (lower.includes("full body")) return "full_body";
  if (lower.includes("squat")) return "squat";
  if (lower.includes("bench")) return "bench";
  if (lower.includes("deadlift")) return "deadlift";
  if (lower.includes("conditioning")) return "conditioning";
  if (lower.includes("athletic")) return "athletic";
  if (lower.includes("strength")) return "strength";
  if (lower.includes("arms")) return "arms";

  return lower.split(/\s+/)[0] ?? lower;
}

/** Rotate split so the first upcoming session is not the same kind as the last completed one. */
export function rotateSplitAvoidingKind(
  split: SessionTemplate[],
  avoidKind: string | undefined
): SessionTemplate[] {
  if (!avoidKind || split.length <= 1) return split;

  for (let offset = 0; offset < split.length; offset += 1) {
    const rotated = [...split.slice(offset), ...split.slice(0, offset)];
    if (sessionKind(rotated[0]!.name) !== avoidKind) {
      return rotated;
    }
  }

  return split;
}

function areConsecutiveWeekdays(earlier: number, later: number): boolean {
  return later - earlier === 1;
}

export interface TemplateDayAssignment {
  template: SessionTemplate;
  dayIndex: number;
}

/** Swap templates on consecutive days that would repeat the same session kind. */
export function avoidConsecutiveSameKind(
  assignments: TemplateDayAssignment[]
): void {
  const sorted = [...assignments].sort((a, b) => a.dayIndex - b.dayIndex);

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i]!;
    const next = sorted[i + 1]!;

    if (!areConsecutiveWeekdays(current.dayIndex, next.dayIndex)) continue;
    if (sessionKind(current.template.name) !== sessionKind(next.template.name)) {
      continue;
    }

    for (let j = i + 2; j < sorted.length; j += 1) {
      const candidate = sorted[j]!;
      if (sessionKind(candidate.template.name) === sessionKind(current.template.name)) {
        continue;
      }

      const nextTemplate = next.template;
      next.template = candidate.template;
      candidate.template = nextTemplate;
      break;
    }
  }
}

/** Ensure the plan start weekday is not the same session kind as the last completed workout. */
export function ensureAnchorDayAvoidsKind(
  assignments: TemplateDayAssignment[],
  anchorWeekday: number,
  avoidKind: string | undefined
): void {
  if (!avoidKind) return;

  const anchor = assignments.find((entry) => entry.dayIndex === anchorWeekday);
  if (!anchor || sessionKind(anchor.template.name) !== avoidKind) return;

  const swapCandidate = assignments.find(
    (entry) =>
      entry.dayIndex !== anchorWeekday &&
      sessionKind(entry.template.name) !== avoidKind
  );
  if (!swapCandidate) return;

  const anchorTemplate = anchor.template;
  anchor.template = swapCandidate.template;
  swapCandidate.template = anchorTemplate;
}
