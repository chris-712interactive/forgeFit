"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function GenerateProgramButton({
  label = "Generate my plan",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/programs/generate", {
          method: "POST",
        });
        const body = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(
            body.error ??
              "We couldn’t build your plan. Try again — if it keeps failing, contact support."
          );
          return;
        }
        router.push("/workout");
        router.refresh();
      } catch {
        setError("Network error — try again when you’re online.");
      }
    });
  }

  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-forge-ember font-display text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "Building your plan…" : label}
      </button>
      {error && (
        <p className="text-sm text-forge-coral" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
