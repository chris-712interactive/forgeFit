import { CommunityWinCheerButton } from "@/components/coaching/community-win-cheer-button";
import { winTypeLabel } from "@/lib/coaching/community-labels";
import type { GamificationContext } from "@/lib/coaching/types";

interface CommunityWinsFeedProps {
  gamification: GamificationContext;
  preview?: boolean;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CommunityWinsFeed({
  gamification,
  preview = false,
}: CommunityWinsFeedProps) {
  if (!gamification.unlocked) {
    return null;
  }

  const hasWins = gamification.communityWins.length > 0;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface p-4 sm:p-5">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Community wins
      </h3>
      <p className="mt-1 text-xs text-forge-muted">
        Recent PRs and milestones from your bucket — cheer peers to keep momentum
        going.
      </p>

      {!gamification.tableReady && (
        <p className="mt-4 rounded-xl border border-forge-gold/30 bg-forge-surface-raised px-3 py-2 text-xs text-forge-muted">
          Apply the Phase 8 gamification migration to enable the win feed.
        </p>
      )}

      {gamification.tableReady && !hasWins && (
        <p className="mt-4 text-sm text-forge-muted">
          {preview
            ? "Wins show up here when athletes in your bucket hit PRs or finish their plan. Join to share yours too."
            : "No wins yet this week. Hit a PR during a workout and it will show up here for your community."}
        </p>
      )}

      {hasWins && (
        <ul className="mt-4 space-y-3">
          {gamification.communityWins.map((win) => (
            <li
              key={win.id}
              className={`rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 py-3 ${
                win.isCurrentUser && !preview ? "ring-1 ring-forge-gold/25" : ""
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-forge-text">
                      {win.displayLabel}
                      {win.isCurrentUser && !preview ? " (you)" : ""}
                    </p>
                    <span className="rounded-full border border-forge-gold/30 bg-forge-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-forge-gold">
                      {winTypeLabel(win.winType)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-forge-gold">{win.headline}</p>
                  {win.detail && (
                    <p className="mt-1 text-xs text-forge-muted">{win.detail}</p>
                  )}
                </div>
                <p className="shrink-0 text-[11px] uppercase tracking-wide text-forge-muted">
                  {formatWhen(win.occurredAt)}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <CommunityWinCheerButton
                  winId={win.id}
                  initialCheered={win.cheeredByMe}
                  initialCount={win.cheerCount}
                  disabled={preview || !gamification.optedIn || win.isCurrentUser}
                  disabledReason={
                    preview
                      ? "Join community to cheer"
                      : win.isCurrentUser
                        ? "Others cheer your wins"
                        : "Join community to cheer"
                  }
                />
                {win.cheerCount > 0 && (
                  <p className="text-[11px] text-forge-muted">
                    {win.cheerCount === 1
                      ? "1 athlete cheered"
                      : `${win.cheerCount} athletes cheered`}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
