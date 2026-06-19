"use client";

import { CommunityModerationPanel } from "@/components/coaching/community-moderation-panel";
import { CommunityOpsMetricsPanel } from "@/components/coaching/community-ops-metrics-panel";
import { CommunityWinsFeed } from "@/components/coaching/community-wins-feed";
import { CrewPanel } from "@/components/coaching/crew-panel";
import { CrewWinsFeed } from "@/components/coaching/crew-wins-feed";
import { FriendsLeaderboard } from "@/components/coaching/friends-leaderboard";
import { HabitScoreBreakdownCard } from "@/components/coaching/habit-score-breakdown-card";
import { HallOfFameCard } from "@/components/coaching/hall-of-fame-card";
import { CommunityNotificationsPanel } from "@/components/coaching/community-notifications-panel";
import { SeasonRecapCard } from "@/components/coaching/season-recap-card";
import { WeeklyChallengeCard } from "@/components/coaching/weekly-challenge-card";
import { WeeklyRivalCard } from "@/components/coaching/weekly-rival-card";
import { CommunityHero } from "@/components/community/community-hero";
import { CommunityStandingsList } from "@/components/community/community-standings-list";
import { WeeklyCommunityRecapCard } from "@/components/home/weekly-community-recap-card";
import type { CommunityPageData } from "@/lib/coaching/types";
import Link from "next/link";
import { useMemo, useState } from "react";

type CommunityTab = "week" | "squad" | "feed";

interface CommunityPageClientProps {
  data: CommunityPageData;
}

const TAB_LABELS: Record<CommunityTab, string> = {
  week: "This week",
  squad: "Squad",
  feed: "Feed",
};

export function CommunityPageClient({ data }: CommunityPageClientProps) {
  const {
    gamification,
    fullLeaderboard,
    totalRankedThisWeek,
    friendsLeaderboard,
    followState,
    notifications,
    unreadNotificationCount,
    crew,
    weeklyChallenge,
    crewChallenge,
    crewWins,
    moderationQueue,
    communityMetrics,
  } = data;

  const [tab, setTab] = useState<CommunityTab>("week");

  const showSquad = gamification.optedIn;
  const showFeed = gamification.unlocked && Boolean(gamification.bucketLabel);

  const tabs = useMemo(() => {
    const items: CommunityTab[] = ["week"];
    if (showSquad) items.push("squad");
    if (showFeed) items.push("feed");
    return items;
  }, [showSquad, showFeed]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 pb-8 sm:max-w-2xl sm:gap-5">
      <header className="px-0.5">
        <h1 className="font-display text-xl font-bold text-forge-text sm:text-2xl">
          Community
        </h1>
        <p className="mt-0.5 text-xs text-forge-muted sm:text-sm">
          Weekly habit competition in your bucket
        </p>
      </header>

      <CommunityHero gamification={gamification} />

      {tabs.length > 1 && (
        <nav
          className="sticky top-0 z-10 -mx-1 rounded-2xl border border-[var(--border)] bg-forge-surface/95 p-1 backdrop-blur-md"
          aria-label="Community sections"
        >
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
            {tabs.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`relative rounded-xl px-2 py-2.5 text-center text-xs font-semibold transition-colors sm:text-sm ${
                  tab === key
                    ? "bg-forge-ember text-white shadow-sm"
                    : "text-forge-muted hover:text-forge-text"
                }`}
              >
                {TAB_LABELS[key]}
                {key === "feed" && unreadNotificationCount > 0 && (
                  <span className="absolute right-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-forge-coral px-1 text-[9px] font-bold text-white">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      )}

      {tab === "week" && (
        <div className="flex flex-col gap-4 sm:gap-5">
          {gamification.league?.seasonRecap && (
            <SeasonRecapCard recap={gamification.league.seasonRecap} />
          )}

          {gamification.weeklyRecap && (
            <WeeklyCommunityRecapCard recap={gamification.weeklyRecap} />
          )}

          {gamification.optedIn && gamification.weeklyRival && (
            <WeeklyRivalCard
              rival={gamification.weeklyRival}
              userRank={gamification.userRank}
              compact
              hideFooterLink
            />
          )}

          {gamification.optedIn && weeklyChallenge && (
            <WeeklyChallengeCard challenge={weeklyChallenge} />
          )}

          {gamification.unlocked &&
            gamification.bucketLabel &&
            (fullLeaderboard.length > 0 || gamification.optedIn) && (
              <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
                <CommunityStandingsList
                  gamification={gamification}
                  entries={fullLeaderboard}
                  totalRanked={totalRankedThisWeek}
                  followState={followState}
                />
              </section>
            )}

          {gamification.optedIn && gamification.habitBreakdown && (
            <HabitScoreBreakdownCard
              breakdown={gamification.habitBreakdown}
              compact
            />
          )}

          {gamification.optedIn && (
            <p className="text-center text-[11px] text-forge-muted">
              Top 30% promote at month end ·{" "}
              <Link
                href="/profile#gamification"
                className="text-forge-ember underline-offset-2 hover:underline"
              >
                Community settings
              </Link>
            </p>
          )}
        </div>
      )}

      {tab === "squad" && showSquad && (
        <div className="flex flex-col gap-4 sm:gap-5">
          <CrewPanel crew={crew} crewChallenge={crewChallenge} />
          {crew && <CrewWinsFeed wins={crewWins} />}
          <FriendsLeaderboard friends={friendsLeaderboard} />
        </div>
      )}

      {tab === "feed" && showFeed && (
        <div className="flex flex-col gap-4 sm:gap-5">
          {gamification.isModerator && communityMetrics && (
            <CommunityOpsMetricsPanel metrics={communityMetrics} />
          )}

          {gamification.isModerator && moderationQueue && (
            <CommunityModerationPanel queue={moderationQueue} />
          )}

          <CommunityWinsFeed
            gamification={gamification}
            preview={!gamification.optedIn}
          />

          {gamification.optedIn && (
            <CommunityNotificationsPanel
              notifications={notifications}
              unreadCount={unreadNotificationCount}
            />
          )}

          {gamification.optedIn && gamification.league && (
            <HallOfFameCard
              entries={gamification.league.hallOfFame}
              bucketLabel={gamification.bucketLabel}
            />
          )}
        </div>
      )}

      {!gamification.unlocked && (
        <p className="text-center text-xs text-forge-muted">
          <Link
            href="/profile#subscription"
            className="font-medium text-forge-ember underline-offset-2 hover:underline"
          >
            View Pro plans
          </Link>
        </p>
      )}
    </div>
  );
}
