"use client";

import type { OnboardingData } from "@/lib/types/profile";
import {
  maxDateOfBirthIso,
  minDateOfBirthIso,
} from "@/lib/profile/identity";

const inputClass =
  "min-h-[52px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 text-forge-text outline-none focus:border-forge-ember";

interface AboutYouStepProps {
  data: Partial<OnboardingData>;
  onChange: (patch: Partial<OnboardingData>) => void;
}

export function AboutYouStep({ data, onChange }: AboutYouStepProps) {
  return (
    <div className="space-y-4">
      <TextField
        label="First name"
        required
        value={data.first_name ?? ""}
        onChange={(value) => onChange({ first_name: value })}
        autoComplete="given-name"
        placeholder="Alex"
      />

      <TextField
        label="Last name"
        required
        value={data.last_name ?? ""}
        onChange={(value) => onChange({ last_name: value })}
        autoComplete="family-name"
        placeholder="Rivera"
      />

      <div>
        <label className="mb-1.5 block text-sm text-forge-muted">
          Date of birth<span className="text-forge-ember"> *</span>
        </label>
        <input
          type="date"
          required
          value={data.date_of_birth ?? ""}
          min={minDateOfBirthIso()}
          max={maxDateOfBirthIso()}
          onChange={(event) => onChange({ date_of_birth: event.target.value })}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-forge-muted">
          Used for age-based program logic and birthday milestones. You must be
          at least 13.
        </p>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  autoComplete,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-forge-muted">
        {label}
        {required && <span className="text-forge-ember"> *</span>}
      </label>
      <input
        type="text"
        required={required}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </div>
  );
}
