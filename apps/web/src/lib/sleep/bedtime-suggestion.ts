import { addDaysIso } from "@/lib/datetime/local-date";
import { formatSleepHours } from "@/lib/sleep/format";
import type { DailySleepLog, BedtimeSuggestion } from "@/lib/sleep/types";
import {
  SLEEP_TARGET_HOURS,
  SLEEP_TARGET_MIN_MINUTES,
} from "@/lib/sleep/types";

const MINUTES_PER_DAY = 24 * 60;
const MIN_NIGHTS_WITH_WAKE = 3;
const MIN_SHORT_NIGHTS = 2;
const WAKE_VARIABILITY_MINUTES = 90;

export type { BedtimeSuggestion } from "./types";

export function isoToLocalMinutes(iso: string, timeZone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(new Date(iso));

    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    const minute = Number(parts.find((part) => part.type === "minute")?.value);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return hour * 60 + minute;
  } catch {
    return null;
  }
}

export function enrichWakeLocalMinutes(
  log: DailySleepLog,
  timeZone: string
): DailySleepLog {
  if (log.wakeLocalMinutes != null) return log;
  if (!log.wakeAt) return log;
  const minutes = isoToLocalMinutes(log.wakeAt, timeZone);
  return minutes != null ? { ...log, wakeLocalMinutes: minutes } : log;
}

function normalizeMinutes(minutes: number): number {
  return ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

function circularMeanMinutes(minutes: number[]): number {
  if (minutes.length === 0) return 0;
  let sinSum = 0;
  let cosSum = 0;
  for (const value of minutes) {
    const angle = (value / MINUTES_PER_DAY) * Math.PI * 2;
    sinSum += Math.sin(angle);
    cosSum += Math.cos(angle);
  }
  const meanAngle = Math.atan2(
    sinSum / minutes.length,
    cosSum / minutes.length
  );
  return normalizeMinutes(Math.round((meanAngle / (Math.PI * 2)) * MINUTES_PER_DAY));
}

function maxCircularDeviation(minutes: number[], mean: number): number {
  let max = 0;
  for (const value of minutes) {
    const diff = Math.abs(value - mean);
    max = Math.max(max, diff, MINUTES_PER_DAY - diff);
  }
  return max;
}

export function formatClockMinutes(minutesSinceMidnight: number): string {
  const normalized = normalizeMinutes(minutesSinceMidnight);
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function buildBedtimeSuggestion(
  logs: DailySleepLog[],
  referenceDate: string
): BedtimeSuggestion | null {
  const weekStart = addDaysIso(referenceDate, -6);
  const weekLogs = logs.filter(
    (log) =>
      log.sleepDate >= weekStart &&
      log.sleepDate <= referenceDate &&
      log.durationMinutes != null &&
      log.durationMinutes > 0
  );

  if (weekLogs.length === 0) return null;

  const avgDurationMinutes = Math.round(
    weekLogs.reduce((sum, log) => sum + (log.durationMinutes ?? 0), 0) /
      weekLogs.length
  );
  const shortNights = weekLogs.filter(
    (log) => (log.durationMinutes ?? 0) < SLEEP_TARGET_MIN_MINUTES
  ).length;

  if (
    avgDurationMinutes >= SLEEP_TARGET_MIN_MINUTES &&
    shortNights < MIN_SHORT_NIGHTS
  ) {
    return null;
  }

  const wakeMinutes = weekLogs
    .map((log) => log.wakeLocalMinutes)
    .filter((value): value is number => value != null);

  if (wakeMinutes.length < MIN_NIGHTS_WITH_WAKE) {
    const deficit = SLEEP_TARGET_MIN_MINUTES - avgDurationMinutes;
    if (deficit <= 0) return null;

    return {
      show: true,
      avgWakeLabel: "",
      suggestedBedtimeLabel: "",
      avgDurationMinutes,
      targetMinutes: SLEEP_TARGET_MIN_MINUTES,
      summary: `You're averaging ${formatSleepHours(avgDurationMinutes)} — about ${deficit} minutes below your ${SLEEP_TARGET_HOURS}h recovery target. Start winding down earlier tonight.`,
      wakeTimeVaries: false,
    };
  }

  const avgWake = circularMeanMinutes(wakeMinutes);
  const suggestedBed = normalizeMinutes(avgWake - SLEEP_TARGET_MIN_MINUTES);
  const variability = maxCircularDeviation(wakeMinutes, avgWake);
  const wakeTimeVaries = variability >= WAKE_VARIABILITY_MINUTES;
  const avgWakeLabel = formatClockMinutes(avgWake);
  const suggestedBedtimeLabel = formatClockMinutes(suggestedBed);

  const summary = wakeTimeVaries
    ? `You're averaging ${formatSleepHours(avgDurationMinutes)}. Wake time varies — if you're up around ${avgWakeLabel}, aim for ${suggestedBedtimeLabel} lights out to reach ${SLEEP_TARGET_HOURS} hours.`
    : `You're averaging ${formatSleepHours(avgDurationMinutes)}. You usually wake around ${avgWakeLabel} — aim for ${suggestedBedtimeLabel} lights out to reach ${SLEEP_TARGET_HOURS} hours.`;

  return {
    show: true,
    avgWakeLabel,
    suggestedBedtimeLabel,
    avgDurationMinutes,
    targetMinutes: SLEEP_TARGET_MIN_MINUTES,
    summary,
    wakeTimeVaries,
  };
}
