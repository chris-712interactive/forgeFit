"use client";

import type { WeeklyChallengeView } from "@/lib/coaching/types";

interface WeeklyChallengeCardProps {
  challenge: WeeklyChallengeView;
}

function formatProgress(challenge: WeeklyChallengeView): string {
  if (challenge.unit === "percent") {
    return `${challenge.progressValue}%`;
  }
  return `${challenge.progressValue}/${challenge.targetValue}`;
}

export function WeeklyChallengeCard({ challenge }: WeeklyChallengeCardProps) {
  const progressPct =
    challenge.unit === "percent"
      ? Math.min(100, challenge.progressValue)
      : Math.min(
          100,
          Math.round((challenge.progressValue / challenge.targetValue) * 100)
        );

  return (
    <section className="rounded-2xl border border-forge-gold/30 bg-forge-gold/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-forge-gold">
            Bucket challenge
          </p>
          <h2 className="mt-1 font-display text-base font-semibold text-forge-text">
            {challenge.title}
          </h2>
          <p className="mt-1 text-xs text-forge-muted">{challenge.description}</p>
        </div>
        {challenge.completed && (
          <span className="rounded-full border border-forge-gold/40 bg-forge-gold/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-forge-gold">
            Complete
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-forge-muted">
          <span>Your progress</span>
          <span className="font-medium text-forge-text">
            {formatProgress(challenge)}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-forge-surface">
          <div
            className="h-full rounded-full bg-forge-gold transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {challenge.bucketParticipantCount > 0 && (
        <p className="mt-3 text-xs text-forge-muted">
          {challenge.bucketCompletedCount} of {challenge.bucketParticipantCount}{" "}
          athletes in your bucket completed this challenge.
        </p>
      )}
    </section>
  );
}
