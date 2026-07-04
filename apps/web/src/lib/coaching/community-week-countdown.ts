import { getWeekBounds } from "@/lib/home/weekly-stats";

export interface CommunityWeekCountdown {
  daysLeft: number;
  progressPct: number;
  endLabel: string;
}

/** Days remaining in the Mon–Sun community scoring week (0 on Sunday). */
export function getCommunityWeekCountdown(
  reference = new Date()
): CommunityWeekCountdown {
  const { end } = getWeekBounds(reference);
  const day = reference.getDay();
  const daysLeft = day === 0 ? 0 : 7 - day;

  const elapsedDays = 7 - daysLeft;
  const progressPct = Math.round((elapsedDays / 7) * 100);

  const endLabel = end.toLocaleDateString(undefined, {
    weekday: "long",
  });

  return { daysLeft, progressPct, endLabel };
}
