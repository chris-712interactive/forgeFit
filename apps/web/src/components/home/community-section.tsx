"use client";

import { setGamificationOptIn } from "@/app/actions/gamification";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { CommunityWinsFeed } from "@/components/coaching/community-wins-feed";
import { LeaderboardCard } from "@/components/coaching/leaderboard-card";
import type { GamificationContext } from "@/lib/coaching/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CommunitySectionProps {
  gamification: GamificationContext;
}

function CommunityOptInBanner({
  onOptIn,
  saving,
  error,
}: {
  onOptIn: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <div className="rounded-xl border border-forge-ember/30 bg-forge-ember/5 px-4 py-3">
      <p className="text-sm font-medium text-forge-text">
        Join to appear on the board and cheer peers
      </p>
      <p className="mt-1 text-xs leading-relaxed text-forge-muted">
        You can browse your community now. Opt in to share your weekly habit
        score, celebrate PRs, and give others a 👏 — first name only.
      </p>
      {error && <p className="mt-2 text-xs text-forge-coral">{error}</p>}
      <button
        type="button"
        onClick={onOptIn}
        disabled={saving}
        className="mt-3 rounded-lg bg-forge-ember px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Joining…" : "Join community"}
      </button>
    </div>
  );
}

export function CommunitySection({ gamification }: CommunitySectionProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOptIn() {
    setSaving(true);
    setError(null);
    const result = await setGamificationOptIn(true);
    setSaving(false);

    if (!result.ok) {
      setError(result.error ?? "Could not join community.");
      return;
    }

    router.refresh();
  }

  const bucketCopy = gamification.bucketLabel
    ? `${gamification.bucketLabel} athletes`
    : "your goal & experience level";

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
            Community
          </h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-forge-text">
            Train alongside {bucketCopy}. Weekly scores and wins keep everyone
            accountable.
          </p>
        </div>
        {gamification.unlocked && gamification.optedIn && gamification.activePeerCount > 0 && (
          <div className="rounded-xl border border-forge-gold/30 bg-forge-surface px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-wide text-forge-muted">
              Active this week
            </p>
            <p className="font-display text-xl font-bold text-forge-gold">
              {gamification.activePeerCount}
            </p>
          </div>
        )}
      </div>

      {!gamification.unlocked && (
        <div className="mt-4 space-y-3">
          <UpgradePrompt
            title="Train with a community"
            description="Pro+ unlocks weekly leaderboards, shared wins, and cheers — all bucketed by your goal and experience so comparisons stay fair."
            suggestedTier="pro_plus"
          />
          <p className="text-xs text-forge-muted">
            Accountability works best when you are not doing it alone. Upgrade to
            see how others in your bucket are showing up each week.
          </p>
        </div>
      )}

      {gamification.unlocked && !gamification.bucketLabel && (
        <p className="mt-4 rounded-xl border border-[var(--border)] bg-forge-surface px-4 py-3 text-sm text-forge-muted">
          Finish onboarding with your goal and experience level to find your
          community bucket.{" "}
          <Link
            href="/onboarding"
            className="font-medium text-forge-ember underline-offset-2 hover:underline"
          >
            Complete profile
          </Link>
        </p>
      )}

      {gamification.unlocked && gamification.bucketLabel && !gamification.optedIn && (
        <div className="mt-4">
          <CommunityOptInBanner
            onOptIn={() => void handleOptIn()}
            saving={saving}
            error={error}
          />
        </div>
      )}

      {gamification.unlocked && gamification.bucketLabel && (
        <div className="mt-5 space-y-5">
          <LeaderboardCard gamification={gamification} embedded preview={!gamification.optedIn} />
          <CommunityWinsFeed gamification={gamification} preview={!gamification.optedIn} />
        </div>
      )}

      {gamification.unlocked && gamification.optedIn && (
        <p className="mt-4 text-[11px] text-forge-muted">
          Community settings in{" "}
          <Link
            href="/profile#gamification"
            className="text-forge-ember underline-offset-2 hover:underline"
          >
            Profile
          </Link>
          . You can opt out anytime.
        </p>
      )}
    </section>
  );
}
