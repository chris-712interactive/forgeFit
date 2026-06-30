"use client";

import {
  getSeasonPhases,
  getSportById,
  getSportCategories,
  getSportsByCategory,
  sportRequiresPosition,
} from "@forgefit/evidence-kb";
import { DAY_LABELS } from "@forgefit/program-engine";
import { SPORT_PRACTICE_GYM_POLICY_OPTIONS } from "@/lib/constants/onboarding";
import {
  defaultSportPracticeGymPolicy,
  resolvedSportPracticeGymPolicy,
} from "@/lib/onboarding/sport-practice";
import { SECONDARY_GOALS } from "@/lib/constants/onboarding";
import type {
  FitnessGoal,
  SportPracticeGymPolicy,
  SportSeasonPhase,
} from "@/lib/types/profile";

interface SportPlanFieldsProps {
  sportCategoryId: string;
  sportId: string;
  sportPositionId: string;
  sportSeasonPhase: SportSeasonPhase;
  sportPracticeDays: number[];
  sportPracticeGymPolicy: SportPracticeGymPolicy | "";
  sportPracticeScheduleVaries: boolean;
  secondaryGoal: FitnessGoal | "";
  onSportCategoryChange: (categoryId: string) => void;
  onSportIdChange: (sportId: string) => void;
  onSportPositionChange: (positionId: string) => void;
  onSeasonPhaseChange: (phase: SportSeasonPhase) => void;
  onSportPracticeDaysChange: (days: number[]) => void;
  onSportPracticeGymPolicyChange: (policy: SportPracticeGymPolicy) => void;
  onSportPracticeScheduleVariesChange: (varies: boolean) => void;
  onSecondaryGoalChange: (goal: FitnessGoal | "") => void;
  /** Which field groups to render — use on profile to split across sub-sections. */
  sections?: "all" | "identity" | "practice";
}

export function SportPlanFields({
  sportCategoryId,
  sportId,
  sportPositionId,
  sportSeasonPhase,
  sportPracticeDays,
  sportPracticeGymPolicy,
  sportPracticeScheduleVaries,
  secondaryGoal,
  onSportCategoryChange,
  onSportIdChange,
  onSportPositionChange,
  onSeasonPhaseChange,
  onSportPracticeDaysChange,
  onSportPracticeGymPolicyChange,
  onSportPracticeScheduleVariesChange,
  onSecondaryGoalChange,
  sections = "all",
}: SportPlanFieldsProps) {
  const categories = getSportCategories();
  const sports = sportCategoryId ? getSportsByCategory(sportCategoryId) : [];
  const sport = getSportById(sportId);
  const showPosition = sportRequiresPosition(sportId);
  const phases = getSeasonPhases();
  const resolvedPolicy = resolvedSportPracticeGymPolicy(
    sportPracticeGymPolicy || undefined,
    sportSeasonPhase
  );
  const showIdentity = sections === "all" || sections === "identity";
  const showPractice = sections === "all" || sections === "practice";

  function togglePracticeDay(dayIndex: number) {
    if (sportPracticeScheduleVaries) return;
    const next = sportPracticeDays.includes(dayIndex)
      ? sportPracticeDays.filter((day) => day !== dayIndex)
      : [...sportPracticeDays, dayIndex].sort((a, b) => a - b);
    onSportPracticeDaysChange(next);
  }

  return (
    <div className="space-y-4">
      {showIdentity ? (
        <>
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
            onChange={(value) => {
              const phase = value as SportSeasonPhase;
              onSeasonPhaseChange(phase);
              if (!sportPracticeGymPolicy) {
                onSportPracticeGymPolicyChange(
                  defaultSportPracticeGymPolicy(phase)
                );
              }
            }}
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
              ...SECONDARY_GOALS.map((g) => ({
                value: g.value,
                label: g.label,
              })),
            ]}
          />
        </>
      ) : null}

      {showPractice ? (
        <>
          <div>
            <p className="mb-1.5 text-sm text-forge-muted">Practice days</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {DAY_LABELS.map((label, dayIndex) => (
                <button
                  key={label}
                  type="button"
                  disabled={sportPracticeScheduleVaries}
                  onClick={() => togglePracticeDay(dayIndex)}
                  className={`min-h-[44px] rounded-xl border px-2 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    sportPracticeDays.includes(dayIndex)
                      ? "border-forge-ember bg-forge-ember/15 text-forge-ember"
                      : "border-[var(--border)] bg-forge-surface-raised text-forge-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-forge-surface-raised p-4">
            <input
              type="checkbox"
              checked={sportPracticeScheduleVaries}
              onChange={(event) => {
                const varies = event.target.checked;
                onSportPracticeScheduleVariesChange(varies);
                if (varies) onSportPracticeDaysChange([]);
              }}
              className="mt-1 h-4 w-4 accent-forge-ember"
            />
            <span>
              <span className="block font-medium text-forge-text">
                Practice days change week to week
              </span>
              <span className="mt-1 block text-sm text-forge-muted">
                We won&apos;t block gym days until your schedule is steady.
              </span>
            </span>
          </label>

          <SelectField
            label="Gym on practice days"
            value={resolvedPolicy}
            onChange={(value) =>
              onSportPracticeGymPolicyChange(value as SportPracticeGymPolicy)
            }
            options={SPORT_PRACTICE_GYM_POLICY_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        </>
      ) : null}
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
        className="min-h-[48px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 text-forge-text outline-none focus:border-forge-ember"
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
