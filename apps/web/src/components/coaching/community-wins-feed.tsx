import type { GamificationContext } from "@/lib/coaching/types";

interface CommunityWinsFeedProps {
  gamification: GamificationContext;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CommunityWinsFeed({ gamification }: CommunityWinsFeedProps) {
  if (!gamification.unlocked || !gamification.optedIn) {
    return null;
  }

  if (!gamification.tableReady || gamification.communityWins.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Community wins
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Recent PRs and milestones from your leaderboard bucket
      </p>

      <ul className="mt-4 space-y-3">
        {gamification.communityWins.map((win) => (
          <li
            key={win.id}
            className="rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-forge-text">
                {win.displayLabel}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-forge-muted">
                {formatWhen(win.occurredAt)}
              </p>
            </div>
            <p className="mt-1 text-sm text-forge-gold">{win.headline}</p>
            {win.detail && (
              <p className="mt-1 text-xs text-forge-muted">{win.detail}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
