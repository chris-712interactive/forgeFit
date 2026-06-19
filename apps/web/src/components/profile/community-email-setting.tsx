"use client";

import { setCommunityWeeklyRecapEmail } from "@/app/actions/community-email";
import type { CommunityEmailSettings } from "@/lib/coaching/community-email";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CommunityEmailSettingProps {
  enabled: boolean;
  email: CommunityEmailSettings;
}

export function CommunityEmailSetting({
  enabled,
  email,
}: CommunityEmailSettingProps) {
  const router = useRouter();
  const [weeklyRecap, setWeeklyRecap] = useState(email.weeklyRecap);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) {
    return null;
  }

  if (!email.configured) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Community email
        </h2>
        <p className="mt-2 text-xs text-forge-muted">
          Weekly recap emails are not configured on this environment yet.
        </p>
      </section>
    );
  }

  async function handleToggle(next: boolean) {
    setSaving(true);
    setError(null);
    const result = await setCommunityWeeklyRecapEmail(next);
    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Could not update email preference.");
      return;
    }

    setWeeklyRecap(next);
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Community email
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Optional Monday recap with last week&apos;s rank and habit score.
      </p>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-forge-text">Weekly recap email</p>
          <p className="mt-1 text-xs text-forge-muted">
            Sent on Mondays when you competed last week. Unsubscribe anytime.
          </p>
          {error && <p className="mt-2 text-xs text-forge-coral">{error}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={weeklyRecap}
          disabled={saving}
          onClick={() => void handleToggle(!weeklyRecap)}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
            weeklyRecap ? "bg-forge-ember" : "bg-forge-muted/40"
          } ${saving ? "opacity-60" : ""}`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
              weeklyRecap ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>
    </section>
  );
}
