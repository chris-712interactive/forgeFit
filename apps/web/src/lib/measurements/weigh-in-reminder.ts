import type { FitnessGoal } from "@/lib/types/profile";

export const WEIGH_IN_REMINDER_DAYS = 7;

export const WEIGH_IN_REMINDER_GOALS = new Set<FitnessGoal>([
  "fat_loss",
  "recomposition",
]);

export interface WeighInReminder {
  daysSinceLastWeighIn: number;
  lastWeighInDate: string | null;
  showBanner: boolean;
}

export function isWeighInReminderGoal(
  goal: FitnessGoal | null | undefined
): goal is FitnessGoal {
  return goal != null && WEIGH_IN_REMINDER_GOALS.has(goal);
}

function parseDateMs(isoDate: string): number {
  return new Date(`${isoDate}T12:00:00Z`).getTime();
}

export function daysSinceIsoDate(fromDate: string, toDate: string): number {
  return Math.max(
    0,
    Math.round((parseDateMs(toDate) - parseDateMs(fromDate)) / 86_400_000)
  );
}

export function buildWeighInReminder(input: {
  goal: FitnessGoal | null;
  lastWeighInDate: string | null;
  todayIso: string;
}): WeighInReminder | null {
  if (!isWeighInReminderGoal(input.goal)) {
    return null;
  }

  if (!input.lastWeighInDate) {
    return {
      daysSinceLastWeighIn: WEIGH_IN_REMINDER_DAYS,
      lastWeighInDate: null,
      showBanner: true,
    };
  }

  const daysSinceLastWeighIn = daysSinceIsoDate(
    input.lastWeighInDate,
    input.todayIso
  );

  return {
    daysSinceLastWeighIn,
    lastWeighInDate: input.lastWeighInDate,
    showBanner: daysSinceLastWeighIn >= WEIGH_IN_REMINDER_DAYS,
  };
}

export function weighInReminderMessage(reminder: WeighInReminder): string {
  if (reminder.lastWeighInDate == null) {
    return "Log a weigh-in to track fat loss — once a week is enough for a reliable trend.";
  }

  if (reminder.daysSinceLastWeighIn >= 14) {
    return `It's been ${reminder.daysSinceLastWeighIn} days since your last weigh-in. A weekly check-in keeps your trend and projections honest.`;
  }

  return `It's been ${reminder.daysSinceLastWeighIn} days since your last weigh-in. Log today to stay on track.`;
}
