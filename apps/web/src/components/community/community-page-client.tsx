"use client";

import { CommunityWinsFeed } from "@/components/coaching/community-wins-feed";
import { CommunityFollowButton } from "@/components/coaching/community-follow-button";
import { CommunityNotificationsPanel } from "@/components/coaching/community-notifications-panel";
import { FriendsLeaderboard } from "@/components/coaching/friends-leaderboard";
import { HabitScoreBreakdownCard } from "@/components/coaching/habit-score-breakdown-card";
import { CommunitySection } from "@/components/home/community-section";
import type { CommunityPageData, FollowState } from "@/lib/coaching/types";
import Link from "next/link";

interface CommunityPageClientProps {
  data: CommunityPageData;
}

export function CommunityPageClient({ data }: CommunityPageClientProps) {
  const {
    gamification,
    fullLeaderboard,
    totalRankedThisWeek,
    friendsLeaderboard,
    followState,
    notifications,
    unreadNotificationCount,
  } = data;

  return (
    <div className="flex flex-col gap-5 pb-4">
      <header>
        <h1 className="font-display text-2xl font-bold text-forge-text">
          Community
        </h1>
        <p className="mt-1 text-sm text-forge-muted">
          Weekly competition in your goal and experience bucket — train together,
          stay accountable.
        </p>
      </header>

      <CommunitySection
        gamification={gamification}
        showLeaderboard={false}
        showWins={false}
      />

      {gamification.optedIn && (
        <CommunityNotificationsPanel
          notifications={notifications}
          unreadCount={unreadNotificationCount}
        />
      )}

      {gamification.optedIn && (
        <FriendsLeaderboard friends={friendsLeaderboard} />
      )}

      {gamification.unlocked &&
        gamification.bucketLabel &&
        gamification.optedIn &&
        gamification.habitBreakdown && (
          <HabitScoreBreakdownCard breakdown={gamification.habitBreakdown} />
        )}

      {gamification.unlocked &&
        gamification.bucketLabel &&
        fullLeaderboard.length > 0 && (
          <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
                  Full standings
                </h2>
                <p className="mt-1 text-xs text-forge-muted">
                  {totalRankedThisWeek} athletes ranked this week
                  {gamification.bucketLabel ? ` · ${gamification.bucketLabel}` : ""}
                  {gamification.optedIn ? " · Follow peers to build your friends board" : ""}
                </p>
              </div>
              {gamification.pointsToNextRank != null &&
                gamification.pointsToNextRank > 0 &&
                gamification.leaderAboveLabel && (
                  <p className="rounded-xl border border-forge-gold/30 bg-forge-surface px-3 py-2 text-right text-xs text-forge-muted">
                    <span className="block font-semibold text-forge-text">
                      {gamification.pointsToNextRank} pts to pass
                    </span>
                    {gamification.leaderAboveLabel}
                  </p>
                )}
            </div>

            <ol className="mt-4 space-y-2">
              {fullLeaderboard.map((entry, index) => {
                const state: FollowState = followState[entry.userId] ?? {
                  following: false,
                  isMutual: false,
                };

                return (
                  <li
                    key={entry.userId}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${
                      entry.isCurrentUser
                        ? "border-forge-gold/40 bg-forge-surface"
                        : "border-[var(--border)] bg-forge-surface/60"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="font-display w-6 shrink-0 text-sm font-bold text-forge-muted">
                        {index + 1}
                      </span>
                      <span
                        className={`truncate text-sm ${
                          entry.isCurrentUser
                            ? "font-semibold text-forge-gold"
                            : "text-forge-text"
                        }`}
                      >
                        {entry.displayLabel}
                        {entry.isCurrentUser ? " (you)" : ""}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-medium text-forge-text">
                        {entry.habitScore}
                      </span>
                      {gamification.optedIn && !entry.isCurrentUser && (
                        <CommunityFollowButton
                          userId={entry.userId}
                          initialState={state}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

      {gamification.unlocked && gamification.bucketLabel && (
        <CommunityWinsFeed gamification={gamification} />
      )}

      {!gamification.unlocked && (
        <p className="text-sm text-forge-muted">
          Upgrade to Pro to join leaderboards and compete with your bucket.{" "}
          <Link
            href="/profile#subscription"
            className="font-medium text-forge-ember underline-offset-2 hover:underline"
          >
            View plans
          </Link>
        </p>
      )}

      <p className="text-[11px] text-forge-muted">
        Progress charts live on{" "}
        <Link
          href="/progress"
          className="text-forge-ember underline-offset-2 hover:underline"
        >
          Progress
        </Link>
        .
      </p>
    </div>
  );
}
