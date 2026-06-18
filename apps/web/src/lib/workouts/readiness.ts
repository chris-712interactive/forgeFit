import { hasFeature } from "@/lib/billing/gates";
import type { SubscriptionSnapshot } from "@/lib/billing/types";
import { getActivityContext } from "@/lib/activity/service";
import { listIntegrationStatuses } from "@/lib/integrations/service";
import { getRecoveryContext } from "@/lib/recovery/service";
import { getSleepContext } from "@/lib/sleep/service";
import { SLEEP_TARGET_MIN_MINUTES } from "@/lib/sleep/types";
import type { WorkoutReadinessContext } from "./device-metrics-types";

export async function getWorkoutReadinessContext(
  userId: string,
  subscription: SubscriptionSnapshot
): Promise<WorkoutReadinessContext> {
  const unlocked = hasFeature(subscription, "device_integrations");
  if (!unlocked) {
    return {
      unlocked: false,
      fitbitConnected: false,
      status: "ready",
      message: "Connect Fitbit on Pro+ for sleep and recovery readiness before training.",
    };
  }

  const [statuses, sleep, recovery, activity] = await Promise.all([
    listIntegrationStatuses(userId),
    getSleepContext(userId, subscription),
    getRecoveryContext(userId, subscription),
    getActivityContext(userId, subscription),
  ]);

  const fitbit = statuses.find((row) => row.provider === "fitbit");
  const fitbitConnected = fitbit?.connected === true;

  if (!fitbitConnected) {
    return {
      unlocked: true,
      fitbitConnected: false,
      status: "ready",
      message: "Connect Fitbit to see sleep, HRV, and heart-rate readiness before you train.",
    };
  }

  const reasons: string[] = [];
  let cautionScore = 0;

  const lastNightMinutes = sleep.lastNight?.durationMinutes;
  if (lastNightMinutes != null && lastNightMinutes < SLEEP_TARGET_MIN_MINUTES) {
    cautionScore += 2;
    reasons.push(
      `Last night ${(lastNightMinutes / 60).toFixed(1)}h sleep (target ${SLEEP_TARGET_MIN_MINUTES / 60}h+)`
    );
  }

  if (recovery.weekStats?.restingHrElevated) {
    cautionScore += 2;
    reasons.push("Resting heart rate is above your recent baseline");
  }

  if (
    recovery.weekStats &&
    recovery.weekStats.daysWithData >= 3 &&
    recovery.weekStats.lowHrvDays >= 3
  ) {
    cautionScore += 2;
    reasons.push("HRV has been below baseline several days this week");
  }

  const yesterdayAzm = (() => {
    if (!activity.series.length) return null;
    const sorted = [...activity.series].sort((a, b) =>
      b.activityDate.localeCompare(a.activityDate)
    );
    const latestDate = sorted[0]?.activityDate;
    if (!latestDate) return null;
    const prior = sorted.find((row) => row.activityDate < latestDate);
    return prior?.activeZoneMinutes ?? null;
  })();

  if (yesterdayAzm != null && yesterdayAzm >= 30) {
    cautionScore += 1;
    reasons.push("Yesterday had high Active Zone Minutes — accumulated fatigue possible");
  }

  if (cautionScore >= 4) {
    return {
      unlocked: true,
      fitbitConnected: true,
      status: "recovery_day",
      message:
        reasons[0] ??
        "Recovery signals suggest keeping today moderate and autoregulating effort.",
    };
  }

  if (cautionScore >= 2) {
    return {
      unlocked: true,
      fitbitConnected: true,
      status: "caution",
      message:
        reasons[0] ?? "Some recovery signals are soft — warm up well and match effort to how you feel.",
    };
  }

  const sleepHours =
    lastNightMinutes != null
      ? `${(lastNightMinutes / 60).toFixed(1)}h sleep`
      : null;

  return {
    unlocked: true,
    fitbitConnected: true,
    status: "ready",
    message: sleepHours
      ? `${sleepHours} — recovery looks adequate for a normal training session.`
      : "Recovery signals look adequate — train to your planned RIR targets.",
  };
}
