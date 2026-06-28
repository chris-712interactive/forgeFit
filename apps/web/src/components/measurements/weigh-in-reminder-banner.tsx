"use client";

import type { WeighInReminder } from "@/lib/measurements/weigh-in-reminder";
import { weighInReminderMessage } from "@/lib/measurements/weigh-in-reminder";
import Link from "next/link";

interface WeighInReminderBannerProps {
  reminder: WeighInReminder;
  variant?: "home" | "progress";
  onLogWeight?: () => void;
}

export function WeighInReminderBanner({
  reminder,
  variant = "home",
  onLogWeight,
}: WeighInReminderBannerProps) {
  if (!reminder.showBanner) {
    return null;
  }

  const href = "/progress?tab=log#log-measurement";

  return (
    <div className="rounded-2xl border border-forge-gold/30 bg-forge-gold/10 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-semibold text-forge-text">
            Time for a weigh-in
          </p>
          <p className="mt-1 text-sm text-forge-muted">
            {weighInReminderMessage(reminder)}
          </p>
          {reminder.lastWeighInDate && (
            <p className="mt-2 text-xs text-forge-muted">
              Last logged: {formatDisplayDate(reminder.lastWeighInDate)}
            </p>
          )}
        </div>
      </div>
      {variant === "progress" && onLogWeight ? (
        <button
          type="button"
          onClick={onLogWeight}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-forge-ember px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forge-glow"
        >
          Log weight
        </button>
      ) : (
        <Link
          href={href}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-forge-ember px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forge-glow"
        >
          Log weight
        </Link>
      )}
    </div>
  );
}

function formatDisplayDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
