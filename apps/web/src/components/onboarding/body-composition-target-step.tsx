"use client";

import {
  FAT_LOSS_PACE_OPTIONS,
  RECOMP_PRIORITY_OPTIONS,
} from "@/lib/constants/onboarding";
import type {
  FatLossPace,
  FitnessGoal,
  OnboardingData,
  RecompPriority,
} from "@/lib/types/profile";
import {
  formatWeight,
  kgToLbs,
  lbsToKg,
  type UnitSystem,
} from "@/lib/units/measurements";
import { useState } from "react";

interface BodyCompositionTargetStepProps {
  data: Partial<OnboardingData>;
  onChange: (patch: Partial<OnboardingData>) => void;
}

export function BodyCompositionTargetStep({
  data,
  onChange,
}: BodyCompositionTargetStepProps) {
  const goal = data.primary_goal;
  const isFatLoss =
    goal === "fat_loss" ||
    (goal === "sport_performance" && data.secondary_goal === "fat_loss");
  const isRecomp =
    goal === "recomposition" ||
    (goal === "sport_performance" && data.secondary_goal === "recomposition");
  const isSportInSeason =
    goal === "sport_performance" && data.sport_season_phase === "in_season";

  if (isSportInSeason && !isFatLoss && !isRecomp) {
    return (
      <p className="text-sm text-forge-muted">
        In-season sport plans prioritize fuel and maintenance — no calorie cut
        here. Continue to equipment.
      </p>
    );
  }

  if (!isFatLoss && !isRecomp) {
    return (
      <p className="text-sm text-forge-muted">
        Your goal doesn&apos;t need a fat-loss pace — we&apos;ll set calories for
        muscle and strength gains. Continue to the next step.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {isFatLoss && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-forge-text">
            How fast do you want to lose fat?
          </p>
          <p className="text-sm text-forge-muted">
            We size your calorie deficit from sports-science ranges — not a
            generic 500 kcal cut. Training burn adds to total fat loss without
            eating back every workout calorie.
          </p>
          {FAT_LOSS_PACE_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              selected={data.fat_loss_pace === option.value}
              onClick={() => onChange({ fat_loss_pace: option.value })}
              title={option.label}
              description={option.description}
            />
          ))}
        </div>
      )}

      {isRecomp && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-forge-text">
            What matters most right now?
          </p>
          <p className="text-sm text-forge-muted">
            Recomposition uses a smaller deficit than fat loss so you can build
            muscle while leaning out. A ~200 kcal/day effective deficit is normal
            here — that is not the same as a slow fat-loss cut.
          </p>
          {RECOMP_PRIORITY_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              selected={data.recomp_priority === option.value}
              onClick={() => onChange({ recomp_priority: option.value })}
              title={option.label}
              description={option.description}
            />
          ))}
        </div>
      )}

      <GoalWeightField
        currentWeightKg={data.weight_kg}
        goalWeightKg={data.goal_weight_kg}
        onGoalWeightChange={(goal_weight_kg) => onChange({ goal_weight_kg })}
        goal={goal!}
      />
    </div>
  );
}

function GoalWeightField({
  currentWeightKg,
  goalWeightKg,
  onGoalWeightChange,
  goal,
}: {
  currentWeightKg?: number;
  goalWeightKg?: number;
  onGoalWeightChange: (kg: number | undefined) => void;
  goal: FitnessGoal;
}) {
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [skipGoal, setSkipGoal] = useState(goalWeightKg == null);
  const isMetric = unit === "metric";

  const displayValue =
    goalWeightKg != null
      ? isMetric
        ? String(goalWeightKg)
        : String(Math.round(kgToLbs(goalWeightKg) * 10) / 10)
      : "";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-forge-surface-raised p-4">
      <p className="font-display text-sm font-semibold text-forge-text">
        Goal weight (optional)
      </p>
      <p className="mt-1 text-sm text-forge-muted">
        Helps forecast when you&apos;ll reach your target (Pro). We don&apos;t
        use this to set daily calories — your pace choice handles that.
      </p>

      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={skipGoal}
          onChange={(event) => {
            setSkipGoal(event.target.checked);
            if (event.target.checked) onGoalWeightChange(undefined);
          }}
          className="mt-0.5 h-4 w-4 accent-forge-ember"
        />
        <span className="text-sm text-forge-muted">Not sure yet — skip for now</span>
      </label>

      {!skipGoal && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            {(["metric", "imperial"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setUnit(value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  unit === value
                    ? "border-forge-ember bg-forge-ember/15 text-forge-ember"
                    : "border-[var(--border)] text-forge-muted"
                }`}
              >
                {value === "metric" ? "kg" : "lbs"}
              </button>
            ))}
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder={isMetric ? "Goal weight (kg)" : "Goal weight (lbs)"}
            value={displayValue}
            onChange={(event) => {
              const val = event.target.value;
              if (!val) {
                onGoalWeightChange(undefined);
                return;
              }
              const parsed = parseFloat(val);
              if (Number.isNaN(parsed)) return;
              onGoalWeightChange(isMetric ? parsed : lbsToKg(parsed));
            }}
            className="min-h-[52px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-4 text-forge-text outline-none focus:border-forge-ember"
          />
          {currentWeightKg != null &&
            goalWeightKg != null &&
            goalWeightKg >= currentWeightKg && (
              <p className="text-sm text-forge-coral" role="alert">
                Goal weight should be below your current weight (
                {formatWeight(currentWeightKg, unit)}).
              </p>
            )}
        </div>
      )}
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-forge-ember bg-forge-ember/10"
          : "border-[var(--border)] bg-forge-surface-raised"
      }`}
    >
      <p className="font-display font-semibold text-forge-text">{title}</p>
      <p className="mt-1 text-sm text-forge-muted">{description}</p>
    </button>
  );
}

export function bodyCompositionStepValid(data: Partial<OnboardingData>): boolean {
  const goal = data.primary_goal;

  if (goal === "sport_performance") {
    if (data.sport_season_phase === "in_season" && !data.secondary_goal) {
      return true;
    }
    if (data.secondary_goal === "fat_loss" && !data.fat_loss_pace) {
      return false;
    }
    if (data.secondary_goal === "recomposition" && !data.recomp_priority) {
      return false;
    }
    return true;
  }

  if (goal === "fat_loss") {
    if (!data.fat_loss_pace) return false;
  } else if (goal === "recomposition") {
    if (!data.recomp_priority) return false;
  } else {
    return true;
  }

  if (
    data.goal_weight_kg != null &&
    data.weight_kg != null &&
    data.goal_weight_kg >= data.weight_kg
  ) {
    return false;
  }

  return true;
}
