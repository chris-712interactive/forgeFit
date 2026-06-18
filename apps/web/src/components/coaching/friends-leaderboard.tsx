import type { CommunityFollowRow } from "@/lib/coaching/types";

interface FriendsLeaderboardProps {
  friends: CommunityFollowRow[];
}

export function FriendsLeaderboard({ friends }: FriendsLeaderboardProps) {
  if (friends.length === 0) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Friends board
        </h2>
        <p className="mt-2 text-sm text-forge-muted">
          Follow athletes in your bucket from the standings below. When you follow
          each other, they appear here for a private mini-leaderboard.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Friends board
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Mutual follows in your bucket — this week&apos;s habit scores
      </p>

      <ol className="mt-4 space-y-2">
        {friends.map((friend, index) => (
          <li
            key={friend.userId}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-forge-surface/60 px-3 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="font-display w-6 text-sm font-bold text-forge-muted">
                {index + 1}
              </span>
              <span className="text-sm font-medium text-forge-text">
                {friend.displayLabel}
              </span>
            </div>
            <span className="text-sm text-forge-muted">
              {friend.habitScore != null ? `${friend.habitScore} pts` : "—"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
