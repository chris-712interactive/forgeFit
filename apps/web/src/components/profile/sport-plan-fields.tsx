"use client";

import {
  getSeasonPhases,
  getSportById,
  getSportCategories,
  getSportsByCategory,
  sportRequiresPosition,
} from "@forgefit/evidence-kb";
import { SECONDARY_GOALS } from "@/lib/constants/onboarding";
import type {
  FitnessGoal,
  SportSeasonPhase,
} from "@/lib/types/profile";

interface SportPlanFieldsProps {
  sportCategoryId: string;
  sportId: string;
  sportPositionId: string;
  sportSeasonPhase: SportSeasonPhase;
  secondaryGoal: FitnessGoal | "";
  onSportCategoryChange: (categoryId: string) => void;
  onSportIdChange: (sportId: string) => void;
  onSportPositionChange: (positionId: string) => void;
  onSeasonPhaseChange: (phase: SportSeasonPhase) => void;
  onSecondaryGoalChange: (goal: FitnessGoal | "") => void;
}

export function SportPlanFields({
  sportCategoryId,
  sportId,
  sportPositionId,
  sportSeasonPhase,
  secondaryGoal,
  onSportCategoryChange,
  onSportIdChange,
  onSportPositionChange,
  onSeasonPhaseChange,
  onSecondaryGoalChange,
}: SportPlanFieldsProps) {
  const categories = getSportCategories();
  const sports = sportCategoryId ? getSportsByCategory(sportCategoryId) : [];
  const sport = getSportById(sportId);
  const showPosition = sportRequiresPosition(sportId);
  const phases = getSeasonPhases();

  return (
    <div className="space-y-4">
      <SelectField
        label="Sport category"
        value={sportCategoryId}
        onChange={(value) => {
          onSportCategoryChange(value);
          onSportIdChange("");
          onSportPositionChange("");
        }}
        options={categories.map((c) => ({ value: c.id, label: c.label }))}
      />

      {sportCategoryId ? (
        <SelectField
          label="Sport"
          value={sportId}
          onChange={(value) => {
            onSportIdChange(value);
            onSportPositionChange("");
          }}
          options={sports.map((s) => ({ value: s.id, label: s.label }))}
        />
      ) : null}

      {showPosition && sport ? (
        <SelectField
          label="Position"
          value={sportPositionId}
          onChange={onSportPositionChange}
          options={sport.positions.map((p) => ({
            value: p.id,
            label: p.label,
          }))}
        />
      ) : null}

      <SelectField
        label="Season phase"
        value={sportSeasonPhase}
        onChange={(value) => onSeasonPhaseChange(value as SportSeasonPhase)}
        options={phases.map((p) => ({ value: p.id, label: p.label }))}
      />

      <SelectField
        label="Secondary focus (optional)"
        value={secondaryGoal}
        onChange={(value) =>
          onSecondaryGoalChange(value ? (value as FitnessGoal) : "")
        }
        options={[
          { value: "", label: "None" },
          ...SECONDARY_GOALS.map((g) => ({ value: g.value, label: g.label })),
        ]}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-forge-muted">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface px-4 text-forge-text outline-none focus:border-forge-ember"
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((option) => (
          <option key={option.value || "none"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
