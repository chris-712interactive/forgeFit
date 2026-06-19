"use client";

import { CommunityWinsFeed } from "@/components/coaching/community-wins-feed";
import { SeasonRecapCard } from "@/components/coaching/season-recap-card";
import { WeeklyRivalCard } from "@/components/coaching/weekly-rival-card";
import { CommunityHero } from "@/components/community/community-hero";
import { CommunityMiniLeaderboard } from "@/components/community/community-mini-leaderboard";
import { WeeklyCommunityRecapCard } from "@/components/home/weekly-community-recap-card";
import type { GamificationContext } from "@/lib/coaching/types";
import Link from "next/link";

interface CommunitySectionProps {
  gamification: GamificationContext;
  showLeaderboard?: boolean;
  showWins?: boolean;
}

export function CommunitySection({
  gamification,
  showLeaderboard = true,
  showWins = true,
}: CommunitySectionProps) {
  const showBucketContent =
    gamification.unlocked && Boolean(gamification.bucketLabel);
  const hasRecap =
    gamification.league?.seasonRecap?.showRecap ||
    gamification.weeklyRecap?.showRecap;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
            Community
          </h2>
          {gamification.unreadNotificationCount > 0 && gamification.optedIn && (
            <p className="mt-0.5 text-xs text-forge-ember">
              {gamification.unreadNotificationCount} new update
              {gamification.unreadNotificationCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
        {gamification.unlocked && (
          <Link
            href="/community"
            className="shrink-0 rounded-full border border-forge-ember/30 bg-forge-ember/10 px-3 py-1.5 text-xs font-semibold text-forge-ember transition-colors hover:bg-forge-ember/20"
          >
            Open community
          </Link>
        )}
      </div>

      <CommunityHero gamification={gamification} variant="compact" />

      {showBucketContent && hasRecap && (
        <div className="flex flex-col gap-2">
          {gamification.league?.seasonRecap && (
            <SeasonRecapCard recap={gamification.league.seasonRecap} />
          )}
          {gamification.weeklyRecap && (
            <WeeklyCommunityRecapCard recap={gamification.weeklyRecap} />
          )}
        </div>
      )}

      {showBucketContent &&
        gamification.optedIn &&
        gamification.weeklyRival && (
          <WeeklyRivalCard
            rival={gamification.weeklyRival}
            userRank={gamification.userRank}
            compact
            hideFooterLink
          />
        )}

      {showBucketContent && showLeaderboard && (
        <div className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-3.5 sm:p-4">
          <CommunityMiniLeaderboard
            gamification={gamification}
            entries={gamification.leaderboard}
            limit={5}
          />
        </div>
      )}

      {showBucketContent && showWins && (
        <CommunityWinsFeed
          gamification={gamification}
          preview={!gamification.optedIn}
          compact
          maxItems={2}
        />
      )}

      {gamification.unlocked && gamification.optedIn && (
        <p className="text-center text-[11px] text-forge-muted">
          Crews, challenges & hall of fame on{" "}
          <Link
            href="/community"
            className="font-medium text-forge-ember underline-offset-2 hover:underline"
          >
            Community
          </Link>
        </p>
      )}
    </section>
  );
}
