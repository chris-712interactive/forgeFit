"use client";

import { setGamificationOptIn } from "@/app/actions/gamification";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface GamificationSettingProps {
  unlocked: boolean;
  optedIn: boolean;
}

export function GamificationSetting({
  unlocked,
  optedIn,
}: GamificationSettingProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(optedIn);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(next: boolean) {
    setSaving(true);
    setError(null);
    const result = await setGamificationOptIn(next);
    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Could not update setting.");
      return;
    }

    setEnabled(next);
    router.refresh();
  }

  return (
    <section
      id="gamification"
      className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5"
    >
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Gamification
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Opt in to weekly leaderboards and a community win feed with others who
        share your goal and experience level. Off by default.
      </p>

      {!unlocked ? (
        <div className="mt-4">
          <UpgradePrompt
            title="Unlock community features"
            description="Pro+ includes opt-in leaderboards, PR celebrations, and personalized coaching copy."
            suggestedTier="pro_plus"
          />
        </div>
      ) : (
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-forge-text">
              Join leaderboards & win feed
            </p>
            <p className="mt-1 text-xs text-forge-muted">
              Shows your first name only. You can turn this off anytime.
            </p>
            {error && (
              <p className="mt-2 text-xs text-forge-coral">{error}</p>
            )}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={saving}
            onClick={() => void handleToggle(!enabled)}
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
              enabled ? "bg-forge-ember" : "bg-forge-muted/40"
            } ${saving ? "opacity-60" : ""}`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
                enabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      )}
    </section>
  );
}
