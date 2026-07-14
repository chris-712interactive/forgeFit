"use client";

import { UpgradePrompt } from "@/components/billing/upgrade-prompt";

interface CustomWorkoutCardProps {
  canUseCustomWorkouts: boolean;
  templateCount: number;
  onOpenBuilder: () => void;
}

export function CustomWorkoutCard({
  canUseCustomWorkouts,
  templateCount,
  onOpenBuilder,
}: CustomWorkoutCardProps) {
  if (!canUseCustomWorkouts) {
    return (
      <UpgradePrompt
        title="Custom workouts — Pro"
        description="Build your own sessions from the exercise library, filtered to your equipment. Import native ForgeRep CSV templates and export completed logs on Pro."
        suggestedTier="pro"
      />
    );
  }

  return (
    <section className="rounded-2xl border border-forge-gold/25 bg-forge-gold/5 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
            Custom workout
          </h2>
          <p className="mt-1 text-sm text-forge-muted">
            Log your own session with equipment-aware exercise picks.
            {templateCount > 0
              ? ` ${templateCount} saved template${templateCount === 1 ? "" : "s"}.`
              : ""}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenBuilder}
        className="mt-4 min-h-[48px] w-full rounded-xl bg-forge-ember px-4 font-display text-sm font-semibold text-white transition-colors hover:bg-forge-glow"
      >
        Build custom workout
      </button>
    </section>
  );
}
