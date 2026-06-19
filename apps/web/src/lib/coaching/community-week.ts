import { getWeekBounds } from "@/lib/home/weekly-stats";

export function communityWeekStartIso(reference = new Date()): string {
  return getWeekBounds(reference).startIso;
}

export function previousCommunityWeekStartIso(reference = new Date()): string {
  const { start } = getWeekBounds(reference);
  const previous = new Date(start);
  previous.setDate(previous.getDate() - 7);
  return getWeekBounds(previous).startIso;
}

export function weekStartBefore(isoWeekStart: string, weeksBack: number): string {
  const date = new Date(`${isoWeekStart}T12:00:00`);
  date.setDate(date.getDate() - weeksBack * 7);
  return getWeekBounds(date).startIso;
}
