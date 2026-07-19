"use client";

import { useMemo, useState } from "react";
import { readActionError } from "@/lib/auth/action-result";
import { completeOnboarding } from "@/app/actions/onboarding";
import {
  CARDIO_EQUIPMENT,
  EXPERIENCE_LEVELS,
  FITNESS_GOALS,
  HEALTH_DISCLAIMER,
  MINUTES_PER_SESSION_OPTIONS,
  RECOVERY_EQUIPMENT,
  SESSIONS_PER_WEEK_OPTIONS,
  SIGNUP_SOURCE_OPTIONS,
  SPORT_PERFORMANCE_GOAL,
  STRENGTH_EQUIPMENT,
} from "@/lib/constants/onboarding";
import { pushSignupSourceEvent } from "@/lib/analytics/events";
import {
  filterPrimaryGoalsForAge,
  validateGoalsForAge,
} from "@/lib/onboarding/age-gates";
import {
  buildOnboardingSteps,
  canProceedStep,
  clampTimeBudgetForData,
  resolveProfileAgeFromData,
  stepSubtitle,
  stepTitle,
  type OnboardingStepId,
} from "@/lib/onboarding/steps";
import {
  capExperienceForAge,
  maxMinutesPerSessionForAge,
  maxSessionsPerWeekForAge,
  minAgeForPrimaryGoal,
} from "@forgefit/program-engine";
import type {
  EquipmentLocation,
  ExperienceLevel,
  FitnessGoal,
  OnboardingData,
} from "@/lib/types/profile";
import { AboutYouStep } from "@/components/onboarding/about-you-step";
import {
  BodyCompositionTargetStep,
} from "@/components/onboarding/body-composition-target-step";
import { HealthDisclaimerStep } from "@/components/onboarding/health-disclaimer-step";
import { MeasurementStep } from "@/components/onboarding/measurement-step";
import { ParentConsentStep } from "@/components/onboarding/parent-consent-step";
import {
  SecondaryGoalStep,
  SportCategoryStep,
  SportPositionStep,
  SportPracticeStep,
  SportSeasonStep,
  SportSelectStep,
} from "@/components/onboarding/sport-steps";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";

const initialData: Partial<OnboardingData> = {
  equipment: [],
  recovery_equipment: [],
  equipment_location: "gym",
  sessions_per_week: 3,
  minutes_per_session: 45,
  health_disclaimer_accepted: false,
};

export function OnboardingWizard() {
  const [currentStepId, setCurrentStepId] =
    useState<OnboardingStepId>("disclaimer");
  const [data, setData] = useState<Partial<OnboardingData>>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const steps = useMemo(() => buildOnboardingSteps(data), [data]);
  const stepIndex = Math.max(0, steps.indexOf(currentStepId));
  const progressPct = Math.round(((stepIndex + 1) / steps.length) * 100);
  const profileAge = resolveProfileAgeFromData(data);

  function update(patch: Partial<OnboardingData>) {
    setData((prev) => {
      const next = { ...prev, ...patch };
      const age = resolveProfileAgeFromData(next);
      if (age != null && next.experience_level) {
        next.experience_level = capExperienceForAge(
          next.experience_level,
          age
        );
      }
      return clampTimeBudgetForData(next);
    });
    setError(null);
  }

  function toggleItem(
    key: "equipment" | "recovery_equipment",
    value: string
  ) {
    const current = data[key] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    update({ [key]: next });
  }

  function canProceed(): boolean {
    return canProceedStep(currentStepId, data);
  }

  function goNext() {
    if (!canProceed()) return;

    if (currentStepId === "about_you" && profileAge != null) {
      const goalError = validateGoalsForAge({
        age: profileAge,
        primary_goal: data.primary_goal!,
        secondary_goal: data.secondary_goal,
        fat_loss_pace: data.fat_loss_pace,
      });
      if (goalError) {
        setError(goalError);
        return;
      }
    }

    const idx = steps.indexOf(currentStepId);
    if (idx >= 0 && idx < steps.length - 1) {
      setCurrentStepId(steps[idx + 1]!);
    }
  }

  function goBack() {
    const idx = steps.indexOf(currentStepId);
    if (idx > 0) {
      setCurrentStepId(steps[idx - 1]!);
    }
  }

  async function handleSubmit() {
    if (!canProceed()) return;
    setSubmitting(true);
    setError(null);

    if (data.signup_source) {
      pushSignupSourceEvent(data.signup_source);
    }

    const result = await completeOnboarding(data as OnboardingData);
    if (result?.error) {
      setError(readActionError(result) ?? "Something went wrong.");
      setSubmitting(false);
    }
  }

  const physiqueGoals = filterPrimaryGoalsForAge(FITNESS_GOALS, profileAge);
  const maxSessions = profileAge
    ? maxSessionsPerWeekForAge(profileAge)
    : 6;
  const maxMinutes = profileAge
    ? maxMinutesPerSessionForAge(profileAge)
    : 90;
  const sessionOptions = SESSIONS_PER_WEEK_OPTIONS.filter((n) => n <= maxSessions);
  const minuteOptions = MINUTES_PER_SESSION_OPTIONS.filter((n) => n <= maxMinutes);

  return (
    <div className="flex min-h-dvh flex-col bg-forge-surface">
      <header className="px-6 pt-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-forge-muted">
            Step {stepIndex + 1} of {steps.length}
          </span>
          <span className="font-display text-sm font-bold text-forge-gold">
            {progressPct}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-forge-surface-raised">
          <div
            className="h-full rounded-full bg-forge-ember transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <main className="flex flex-1 flex-col px-6 py-6">
        <StepShell
          title={stepTitle(currentStepId)}
          subtitle={stepSubtitle(currentStepId)}
        >
          {currentStepId === "disclaimer" && (
            <HealthDisclaimerStep
              accepted={data.health_disclaimer_accepted === true}
              onAcceptedChange={(accepted) =>
                update({ health_disclaimer_accepted: accepted })
              }
            />
          )}

          {currentStepId === "goal" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-forge-muted">Sport</p>
              <OptionCard
                selected={data.primary_goal === SPORT_PERFORMANCE_GOAL.value}
                onClick={() =>
                  update({
                    primary_goal: SPORT_PERFORMANCE_GOAL.value,
                    secondary_goal: undefined,
                    fat_loss_pace: undefined,
                    recomp_priority: undefined,
                  })
                }
                title={SPORT_PERFORMANCE_GOAL.label}
                description={SPORT_PERFORMANCE_GOAL.description}
              />

              <p className="pt-2 text-sm font-medium text-forge-muted">
                Physique & strength
              </p>
              {physiqueGoals.map((goal) => (
                <OptionCard
                  key={goal.value}
                  selected={data.primary_goal === goal.value}
                  disabled={goal.disabled}
                  onClick={() => {
                    if (goal.disabled) return;
                    update({
                      primary_goal: goal.value as FitnessGoal,
                      sport_id: undefined,
                      sport_position_id: undefined,
                      sport_season_phase: undefined,
                      sport_practice_days: undefined,
                      sport_practice_gym_policy: undefined,
                      sport_practice_schedule_varies: undefined,
                      sport_category_id: undefined,
                      secondary_goal: undefined,
                      fat_loss_pace:
                        goal.value === "fat_loss" ? data.fat_loss_pace : undefined,
                      recomp_priority:
                        goal.value === "recomposition"
                          ? data.recomp_priority
                          : undefined,
                    });
                  }}
                  title={
                    profileAge == null &&
                    minAgeForPrimaryGoal(goal.value) > 13
                      ? `${goal.label} (${minAgeForPrimaryGoal(goal.value)}+)`
                      : goal.label
                  }
                  description={
                    goal.blockedReason ?? goal.description
                  }
                />
              ))}
            </div>
          )}

          {currentStepId === "sport_category" && (
            <SportCategoryStep data={data} onChange={update} />
          )}
          {currentStepId === "sport" && (
            <SportSelectStep data={data} onChange={update} />
          )}
          {currentStepId === "sport_position" && (
            <SportPositionStep data={data} onChange={update} />
          )}
          {currentStepId === "sport_season" && (
            <SportSeasonStep data={data} onChange={update} />
          )}
          {currentStepId === "sport_practice" && (
            <SportPracticeStep data={data} onChange={update} />
          )}
          {currentStepId === "secondary_goal" && (
            <SecondaryGoalStep data={data} onChange={update} />
          )}

          {currentStepId === "experience" && (
            <div className="space-y-3">
              {EXPERIENCE_LEVELS.map((level) => {
                const capped =
                  profileAge != null
                    ? capExperienceForAge(
                        level.value as ExperienceLevel,
                        profileAge
                      ) !== level.value
                    : false;
                return (
                  <OptionCard
                    key={level.value}
                    selected={data.experience_level === level.value}
                    disabled={capped}
                    onClick={() =>
                      update({
                        experience_level: level.value as ExperienceLevel,
                      })
                    }
                    title={level.label}
                    description={
                      capped
                        ? "Available at age 16+ — we'll start you at intermediate."
                        : level.description
                    }
                  />
                );
              })}
            </div>
          )}

          {currentStepId === "about_you" && (
            <AboutYouStep data={data} onChange={update} />
          )}

          {currentStepId === "parent_consent" && (
            <ParentConsentStep data={data} onChange={update} />
          )}

          {currentStepId === "measurements" && (
            <MeasurementStep data={data} onChange={update} />
          )}

          {currentStepId === "body_comp" && (
            <BodyCompositionTargetStep data={data} onChange={update} />
          )}

          {currentStepId === "equipment" && (
            <>
              <SelectField
                label="Primary location"
                value={data.equipment_location ?? "gym"}
                onChange={(v) =>
                  update({ equipment_location: v as EquipmentLocation })
                }
                options={[
                  { value: "gym", label: "Commercial gym" },
                  { value: "home", label: "Home gym" },
                  { value: "both", label: "Both" },
                ]}
              />
              <p className="mt-4 mb-2 text-sm text-forge-muted">
                Strength & accessories
              </p>
              <div className="grid grid-cols-2 gap-2">
                {STRENGTH_EQUIPMENT.map((item) => (
                  <Chip
                    key={item.value}
                    label={item.label}
                    selected={data.equipment?.includes(item.value) ?? false}
                    onClick={() => toggleItem("equipment", item.value)}
                  />
                ))}
              </div>
              <p className="mt-4 mb-2 text-sm text-forge-muted">Cardio machines</p>
              <div className="grid grid-cols-2 gap-2">
                {CARDIO_EQUIPMENT.map((item) => (
                  <Chip
                    key={item.value}
                    label={item.label}
                    selected={data.equipment?.includes(item.value) ?? false}
                    onClick={() => toggleItem("equipment", item.value)}
                  />
                ))}
              </div>
              <p className="mt-4 mb-2 text-sm text-forge-muted">
                Recovery tools{" "}
                <span className="font-normal text-forge-muted/80">(optional)</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {RECOVERY_EQUIPMENT.map((item) => (
                  <Chip
                    key={item.value}
                    label={item.label}
                    selected={
                      data.recovery_equipment?.includes(item.value) ?? false
                    }
                    onClick={() => toggleItem("recovery_equipment", item.value)}
                  />
                ))}
              </div>
            </>
          )}

          {currentStepId === "time" && (
            <>
              {profileAge != null && profileAge <= 17 ? (
                <p className="mb-4 text-sm text-forge-muted">
                  Age-appropriate caps: up to {maxSessions} sessions/week and{" "}
                  {maxMinutes} minutes per session.
                </p>
              ) : null}
              <p className="mb-2 text-sm text-forge-muted">Sessions per week</p>
              <div className="mb-6 flex flex-wrap gap-2">
                {sessionOptions.map((n) => (
                  <Chip
                    key={n}
                    label={`${n}×`}
                    selected={data.sessions_per_week === n}
                    onClick={() => update({ sessions_per_week: n })}
                  />
                ))}
              </div>
              <p className="mb-2 text-sm text-forge-muted">Minutes per session</p>
              <div className="flex flex-wrap gap-2">
                {minuteOptions.map((n) => (
                  <Chip
                    key={n}
                    label={`${n} min`}
                    selected={data.minutes_per_session === n}
                    onClick={() => update({ minutes_per_session: n })}
                  />
                ))}
              </div>
            </>
          )}

          {currentStepId === "finish" && (
            <>
              <textarea
                value={data.why_started ?? ""}
                onChange={(e) => update({ why_started: e.target.value })}
                rows={4}
                maxLength={500}
                placeholder="I want to feel stronger, more confident, and show up for myself every day…"
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-forge-surface-raised p-4 text-forge-text outline-none focus:border-forge-ember focus:ring-1 focus:ring-forge-ember"
              />
              <p className="mt-2 text-right text-xs text-forge-muted">
                {(data.why_started?.length ?? 0)}/500 · at least 10 characters
              </p>
              <div className="mt-6">
                <PwaInstallPrompt showAfterOnboarding />
              </div>
              <div className="mt-6">
                <p className="text-sm font-medium text-forge-text">
                  What were you using before?{" "}
                  <span className="font-normal text-forge-muted">(optional)</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SIGNUP_SOURCE_OPTIONS.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={data.signup_source === option.value}
                      onClick={() =>
                        update({
                          signup_source:
                            data.signup_source === option.value
                              ? undefined
                              : option.value,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm text-forge-muted">
                Tap finish to generate your program and start Day 1.
              </p>
            </>
          )}
        </StepShell>

        {error && (
          <p className="mt-4 text-sm text-forge-coral" role="alert">
            {error}
          </p>
        )}
      </main>

      <footer className="flex gap-3 border-t border-[var(--border)] px-6 py-4 pb-8">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="min-h-[52px] flex-1 rounded-xl border border-[var(--border)] font-medium text-forge-muted"
          >
            Back
          </button>
        )}
        {currentStepId !== "finish" ? (
          <button
            type="button"
            disabled={!canProceed()}
            onClick={goNext}
            className="min-h-[52px] flex-[2] rounded-xl bg-forge-ember font-display font-bold text-white disabled:opacity-40"
          >
            {currentStepId === "disclaimer" ? "I agree — continue" : "Continue"}
          </button>
        ) : (
          <button
            type="button"
            disabled={!canProceed() || submitting}
            onClick={handleSubmit}
            className="min-h-[52px] flex-[2] rounded-xl bg-forge-ember font-display font-bold text-white disabled:opacity-40"
          >
            {submitting ? "Forging your plan…" : "Finish — Let's Go!"}
          </button>
        )}
      </footer>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-forge-text">
        {title}
      </h1>
      <p className="mt-2 text-forge-muted">{subtitle}</p>
      <div className="mt-6 sm:mt-8">{children}</div>
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
      <p className="mt-1 text-sm text-forge-muted">{description}</p>
    </button>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
        selected
          ? "border-forge-ember bg-forge-ember/15 text-forge-ember"
          : "border-[var(--border)] bg-forge-surface-raised text-forge-muted"
      }`}
    >
      {label}
    </button>
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
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[52px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 text-forge-text outline-none focus:border-forge-ember"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
