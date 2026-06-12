"use client";

import { useState } from "react";
import { completeOnboarding } from "@/app/actions/onboarding";
import {
  CARDIO_EQUIPMENT,
  EXPERIENCE_LEVELS,
  FITNESS_GOALS,
  HEALTH_DISCLAIMER,
  MINUTES_PER_SESSION_OPTIONS,
  RECOVERY_EQUIPMENT,
  SESSIONS_PER_WEEK_OPTIONS,
  STRENGTH_EQUIPMENT,
} from "@/lib/constants/onboarding";
import type {
  EquipmentLocation,
  ExperienceLevel,
  FitnessGoal,
  OnboardingData,
} from "@/lib/types/profile";
import { AboutYouStep } from "@/components/onboarding/about-you-step";
import { HealthDisclaimerStep } from "@/components/onboarding/health-disclaimer-step";
import { MeasurementStep } from "@/components/onboarding/measurement-step";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";

const TOTAL_STEPS = 9;

const initialData: Partial<OnboardingData> = {
  equipment: [],
  recovery_equipment: [],
  equipment_location: "gym",
  sessions_per_week: 3,
  minutes_per_session: 45,
  health_disclaimer_accepted: false,
};

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
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
    switch (step) {
      case 1:
        return data.health_disclaimer_accepted === true;
      case 2:
        return !!data.primary_goal;
      case 3:
        return !!data.experience_level;
      case 4:
        return (
          !!data.first_name?.trim() &&
          !!data.last_name?.trim() &&
          !!data.date_of_birth
        );
      case 5:
        return (
          !!data.sex &&
          !!data.height_cm &&
          !!data.weight_kg
        );
      case 6:
        return (data.equipment?.length ?? 0) > 0;
      case 7:
        return true;
      case 8:
        return !!data.sessions_per_week && !!data.minutes_per_session;
      case 9:
        return (data.why_started?.trim().length ?? 0) >= 10;
      default:
        return false;
    }
  }

  async function handleSubmit() {
    if (!canProceed()) return;
    setSubmitting(true);
    setError(null);

    const result = await completeOnboarding(data as OnboardingData);
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-forge-surface">
      <header className="px-6 pt-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-forge-muted">
            Step {step} of {TOTAL_STEPS}
          </span>
          <span className="font-display text-sm font-bold text-forge-gold">
            {Math.round((step / TOTAL_STEPS) * 100)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-forge-surface-raised">
          <div
            className="h-full rounded-full bg-forge-ember transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </header>

      <main className="flex flex-1 flex-col px-6 py-6">
        {step === 1 && (
          <StepShell
            title={HEALTH_DISCLAIMER.title}
            subtitle="Please read and acknowledge before continuing."
          >
            <HealthDisclaimerStep
              accepted={data.health_disclaimer_accepted === true}
              onAcceptedChange={(accepted) =>
                update({ health_disclaimer_accepted: accepted })
              }
            />
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            title="What's your main goal?"
            subtitle="We'll build your program around this."
          >
            <div className="space-y-3">
              {FITNESS_GOALS.map((goal) => (
                <OptionCard
                  key={goal.value}
                  selected={data.primary_goal === goal.value}
                  onClick={() =>
                    update({ primary_goal: goal.value as FitnessGoal })
                  }
                  title={goal.label}
                  description={goal.description}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell
            title="How experienced are you?"
            subtitle="No wrong answer — we'll meet you where you are."
          >
            <div className="space-y-3">
              {EXPERIENCE_LEVELS.map((level) => (
                <OptionCard
                  key={level.value}
                  selected={data.experience_level === level.value}
                  onClick={() =>
                    update({
                      experience_level: level.value as ExperienceLevel,
                    })
                  }
                  title={level.label}
                  description={level.description}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell
            title="About you"
            subtitle="We'll personalize your plan and milestones."
          >
            <AboutYouStep data={data} onChange={update} />
          </StepShell>
        )}

        {step === 5 && (
          <StepShell
            title="Your measurements"
            subtitle="Choose your units once — we handle conversions behind the scenes."
          >
            <MeasurementStep data={data} onChange={update} />
          </StepShell>
        )}

        {step === 6 && (
          <StepShell
            title="What equipment do you have?"
            subtitle="Select everything available to you."
          >
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
            <p className="mt-4 mb-2 text-sm text-forge-muted">Strength & accessories</p>
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
          </StepShell>
        )}

        {step === 7 && (
          <StepShell
            title="Recovery tools"
            subtitle="Optional — we'll weave these into your plan."
          >
            <div className="grid grid-cols-2 gap-2">
              {RECOVERY_EQUIPMENT.map((item) => (
                <Chip
                  key={item.value}
                  label={item.label}
                  selected={
                    data.recovery_equipment?.includes(item.value) ?? false
                  }
                  onClick={() =>
                    toggleItem("recovery_equipment", item.value)
                  }
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 8 && (
          <StepShell
            title="How much time do you have?"
            subtitle="Any amount works — we'll make it count."
          >
            <p className="mb-2 text-sm text-forge-muted">Sessions per week</p>
            <div className="mb-6 flex flex-wrap gap-2">
              {SESSIONS_PER_WEEK_OPTIONS.map((n) => (
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
              {MINUTES_PER_SESSION_OPTIONS.map((n) => (
                <Chip
                  key={n}
                  label={`${n} min`}
                  selected={data.minutes_per_session === n}
                  onClick={() => update({ minutes_per_session: n })}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 9 && (
          <StepShell
            title="Why did you start?"
            subtitle="We'll remind you of this when you need it most."
          >
            <PwaInstallPrompt showAfterOnboarding />
            <textarea
              value={data.why_started ?? ""}
              onChange={(e) => update({ why_started: e.target.value })}
              rows={5}
              maxLength={500}
              placeholder="I want to feel stronger, more confident, and show up for myself every day…"
              className="mt-4 w-full resize-none rounded-xl border border-[var(--border)] bg-forge-surface-raised p-4 text-forge-text outline-none focus:border-forge-ember focus:ring-1 focus:ring-forge-ember"
            />
            <p className="mt-2 text-right text-xs text-forge-muted">
              {(data.why_started?.length ?? 0)}/500
            </p>
          </StepShell>
        )}

        {error && (
          <p className="mt-4 text-sm text-forge-coral" role="alert">
            {error}
          </p>
        )}
      </main>

      <footer className="flex gap-3 border-t border-[var(--border)] px-6 py-4 pb-8">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="min-h-[52px] flex-1 rounded-xl border border-[var(--border)] font-medium text-forge-muted"
          >
            Back
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            disabled={!canProceed()}
            onClick={() => setStep((s) => s + 1)}
            className="min-h-[52px] flex-[2] rounded-xl bg-forge-ember font-display font-bold text-white disabled:opacity-40"
          >
            {step === 1 ? "I agree — continue" : "Continue"}
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
        <option value="" disabled>
          Select…
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
