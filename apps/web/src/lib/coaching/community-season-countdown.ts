export interface CommunitySeasonCountdown {
  daysLeft: number;
  progressPct: number;
  endLabel: string;
}

/** Days remaining in the calendar-month league season (0 on the last day). */
export function getCommunitySeasonCountdown(
  reference = new Date()
): CommunitySeasonCountdown {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();
  const dayOfMonth = reference.getDate();
  const daysLeft = totalDays - dayOfMonth;

  const progressPct = Math.round((dayOfMonth / totalDays) * 100);

  const endLabel = lastDayOfMonth.toLocaleDateString(undefined, {
    month: "long",
  });

  return { daysLeft, progressPct, endLabel };
}
