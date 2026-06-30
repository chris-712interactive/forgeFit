"use client";

import type { OnboardingData } from "@/lib/types/profile";
import { LegalFooter } from "@/components/legal/legal-document";

const inputClass =
  "min-h-[52px] w-full rounded-xl border border-[var(--border)] bg-forge-surface-raised px-4 text-forge-text outline-none focus:border-forge-ember";

interface ParentConsentStepProps {
  data: Partial<OnboardingData>;
  onChange: (patch: Partial<OnboardingData>) => void;
}

export function ParentConsentStep({ data, onChange }: ParentConsentStepProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-forge-steel/30 bg-forge-steel/5 p-4 text-sm leading-relaxed text-forge-text">
        <p>
          Because you&apos;re under 16, ask a parent or guardian to review our
          Terms and Privacy Policy before you continue. ForgeRep provides
          educational training plans — not medical advice.
        </p>
      </div>

      <TextField
        label="Parent or guardian full name"
        required
        value={data.parent_consent_name ?? ""}
        onChange={(value) => onChange({ parent_consent_name: value })}
        autoComplete="name"
        placeholder="Jordan Smith"
      />

      <TextField
        label="Parent or guardian email"
        required
        type="email"
        value={data.parent_consent_email ?? ""}
        onChange={(value) => onChange({ parent_consent_email: value })}
        autoComplete="email"
        placeholder="parent@example.com"
      />

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-forge-surface-raised p-4">
        <input
          type="checkbox"
          checked={data.parent_consent_acknowledged === true}
          onChange={(event) =>
            onChange({ parent_consent_acknowledged: event.target.checked })
          }
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-[var(--border)] accent-forge-ember"
        />
        <span className="text-sm leading-relaxed text-forge-text">
          My parent or guardian knows I&apos;m using ForgeRep and agrees to the
          Terms and Privacy Policy.
        </span>
      </label>

      <LegalFooter />
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-forge-muted">
        {label}
        {required && <span className="text-forge-ember"> *</span>}
      </label>
      <input
        type={type}
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
