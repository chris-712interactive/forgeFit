"use client";

import { HEALTH_DISCLAIMER } from "@/lib/constants/onboarding";
import { LegalFooter } from "@/components/legal/legal-document";

interface HealthDisclaimerStepProps {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
}

export function HealthDisclaimerStep({
  accepted,
  onAcceptedChange,
}: HealthDisclaimerStepProps) {
  return (
    <>
      <div className="rounded-xl border border-forge-gold/30 bg-forge-gold/5 p-4">
        <div className="max-h-64 space-y-3 overflow-y-auto pr-1 text-sm leading-relaxed text-forge-text">
          {HEALTH_DISCLAIMER.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-forge-surface-raised p-4">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => onAcceptedChange(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-[var(--border)] accent-forge-ember"
        />
        <span className="text-sm leading-relaxed text-forge-text">
          {HEALTH_DISCLAIMER.checkboxLabel}
        </span>
      </label>
      <LegalFooter className="mt-4" />
    </>
  );
}
