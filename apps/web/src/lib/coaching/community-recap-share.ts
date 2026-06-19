import type { WeeklyCommunityRecap } from "./types";

export function buildWeeklyRecapShareText(recap: WeeklyCommunityRecap): string {
  const parts = [
    `I finished #${recap.lastWeekRank} in my ForgeFit bucket last week`,
  ];
  if (recap.lastWeekScore != null) {
    parts.push(`with ${recap.lastWeekScore} habit points`);
  }
  if (recap.bucketLabel) {
    parts.push(`(${recap.bucketLabel})`);
  }
  if (recap.crewName) {
    parts.push(`— crew: ${recap.crewName}`);
  }
  parts.push("New week, new climb.");
  return parts.join(" ");
}

export function wacpDelta(current: number, prior: number): number {
  return current - prior;
}
