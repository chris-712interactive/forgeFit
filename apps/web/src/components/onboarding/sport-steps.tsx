"use client";

import {
  getSportCategories,
  getSportsByCategory,
  getSeasonPhases,
  getSportById,
} from "@forgefit/evidence-kb";
import type { OnboardingData, SportSeasonPhase } from "@/lib/types/profile";
import { SECONDARY_GOALS } from "@/lib/constants/onboarding";
import { filterSecondaryGoalsForAge } from "@/lib/onboarding/age-gates";
import { resolveProfileAgeFromData } from "@/lib/onboarding/steps";

interface SportStepProps {
  data: Partial<OnboardingData>;
  onChange: (patch: Partial<OnboardingData>) => void;
}

export function SportCategoryStep({ data, onChange }: SportStepProps) {
  const categories = getSportCategories();

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {categories.map((category) => (
        <OptionCard
          key={category.id}
          selected={data.sport_category_id === category.id}
          onClick={() =>
            onChange({
              sport_category_id: category.id,
              sport_id: undefined,
              sport_position_id: undefined,
            })
          }
          title={category.label}
          description=""
        />
      ))}
    </div>
  );
}

export function SportSelectStep({ data, onChange }: SportStepProps) {
  const sports = data.sport_category_id
    ? getSportsByCategory(data.sport_category_id)
    : [];

  return (
    <div className="space-y-3">
      {sports.map((sport) => (
        <OptionCard
          key={sport.id}
          selected={data.sport_id === sport.id}
          onClick={() =>
            onChange({
              sport_id: sport.id,
              sport_position_id: undefined,
            })
          }
          title={sport.label}
          description={sport.description}
        />
      ))}
    </div>
  );
}

export function SportPositionStep({ data, onChange }: SportStepProps) {
  const sport = getSportById(data.sport_id);
  if (!sport) return null;

  return (
    <div className="space-y-3">
      {sport.positions.map((position) => (
        <OptionCard
          key={position.id}
          selected={data.sport_position_id === position.id}
          onClick={() => onChange({ sport_position_id: position.id })}
          title={position.label}
          description=""
        />
      ))}
    </div>
  );
}

export function SportSeasonStep({ data, onChange }: SportStepProps) {
  const phases = getSeasonPhases();

  return (
    <div className="space-y-3">
      {phases.map((phase) => (
        <OptionCard
          key={phase.id}
          selected={data.sport_season_phase === phase.id}
          onClick={() =>
            onChange({ sport_season_phase: phase.id as SportSeasonPhase })
          }
          title={phase.label}
          description={phase.description}
        />
      ))}
    </div>
  );
}

export function SecondaryGoalStep({ data, onChange }: SportStepProps) {
  const age = resolveProfileAgeFromData(data);
  const options = filterSecondaryGoalsForAge(SECONDARY_GOALS, age);

  return (
    <div className="space-y-3">
      <OptionCard
        selected={!data.secondary_goal}
        onClick={() => onChange({ secondary_goal: undefined })}
        title="No secondary focus"
        description="Sport performance only — recommended in season"
      />
      {options.map((goal) => (
        <OptionCard
          key={goal.value}
          selected={data.secondary_goal === goal.value}
          disabled={goal.disabled}
          onClick={() => {
            if (!goal.disabled) {
              onChange({ secondary_goal: goal.value });
            }
          }}
          title={goal.label}
          description={
            goal.blockedReason
              ? goal.blockedReason
              : goal.description
          }
        />
      ))}
    </div>
  );
}

function OptionCard({
  selected,
  disabled,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? "border-forge-ember bg-forge-ember/10"
          : "border-[var(--border)] bg-forge-surface-raised"
      }`}
    >
      <p className="font-display font-semibold text-forge-text">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-forge-muted">{description}</p>
      ) : null}
    </button>
  );
}
