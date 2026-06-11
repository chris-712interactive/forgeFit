"use client";

import { acceptHealthDisclaimer } from "@/app/actions/disclaimer";
import { HealthDisclaimerStep } from "@/components/onboarding/health-disclaimer-step";
import { HEALTH_DISCLAIMER } from "@/lib/constants/onboarding";
import { useState, useTransition } from "react";

export default function DisclaimerPage() {
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      setError(null);
      const result = await acceptHealthDisclaimer({
        health_disclaimer_accepted: accepted,
      });
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-forge-surface">
      <main className="flex flex-1 flex-col px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-forge-text">
          {HEALTH_DISCLAIMER.title}
        </h1>
        <p className="mt-2 text-forge-muted">
          Please review and accept before continuing to ForgeFit.
        </p>

        <div className="mt-6">
          <HealthDisclaimerStep
            accepted={accepted}
            onAcceptedChange={setAccepted}
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-forge-coral" role="alert">
            {error}
          </p>
        )}
      </main>

      <footer className="border-t border-[var(--border)] px-6 py-4 pb-8">
        <button
          type="button"
          disabled={!accepted || pending}
          onClick={handleSubmit}
          className="min-h-[52px] w-full rounded-xl bg-forge-ember font-display font-bold text-white disabled:opacity-40"
        >
          {pending ? "Saving…" : "I agree — continue to ForgeFit"}
        </button>
      </footer>
    </div>
  );
}
