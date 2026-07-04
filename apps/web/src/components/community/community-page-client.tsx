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
import { CommunityActivityPulse } from "@/components/community/community-activity-pulse";
import { CommunityArenaRibbon } from "@/components/community/community-arena-ribbon";
import { CommunityHero } from "@/components/community/community-hero";
import { CommunityPodiumStandings } from "@/components/community/community-podium-standings";
import {
  CommunityQuickActions,
  useCommunityQuickActionHandlers,
} from "@/components/community/community-quick-actions";
import { CommunityRivalShowdown } from "@/components/community/community-rival-showdown";
import { CommunityCountdownArcs } from "@/components/community/community-countdown-arcs";
import { WeeklyCommunityRecapCard } from "@/components/home/weekly-community-recap-card";
import type { CommunityPageData } from "@/lib/coaching/types";
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
    crew,
    weeklyChallenge,
    crewChallenge,
    crewWins,
    moderationQueue,
    communityMetrics,
  } = data;

  const {
    scrollToWins,
    scrollToSquad,
    scrollToAlerts,
  } = useCommunityQuickActionHandlers();

  const hasBucket = gamification.unlocked && Boolean(gamification.bucketLabel);
  const showArena = hasBucket && gamification.optedIn;
  const latestWin = gamification.communityWins[0] ?? null;
  const crewProgressLabel =
    crew && crewChallenge
      ? `${crewChallenge.completedCount}/${crewChallenge.memberCount}`
      : null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 pb-8 sm:max-w-2xl sm:gap-5">
      <header className="flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-forge-text sm:text-2xl">
            Community
          </h1>
          <p className="mt-0.5 text-xs text-forge-muted sm:text-sm">
            {hasBucket
              ? gamification.bucketLabel
              : "Weekly habit competition in your bucket"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hasBucket && <CommunityCountdownArcs />}
          {showArena && unreadNotificationCount > 0 && (
            <button
              type="button"
              onClick={scrollToAlerts}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-forge-surface-raised text-forge-muted transition-colors hover:text-forge-text"
              aria-label={`${unreadNotificationCount} unread notifications`}
            >
              <span className="text-sm leading-none">●</span>
              <span className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-forge-coral px-0.5 text-[8px] font-bold text-white">
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            </button>
          )}
        </div>
      </header>

      {!hasBucket ? (
        <>
          <CommunityHero gamification={gamification} />
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
        </>
      ) : !gamification.optedIn ? (
        <>
          <CommunityHero gamification={gamification} />

          {(fullLeaderboard.length > 0 || gamification.communityWins.length > 0) && (
            <div className="flex flex-col gap-4 sm:gap-5">
              {fullLeaderboard.length > 0 && (
                <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
                  <CommunityPodiumStandings
                    gamification={gamification}
                    entries={fullLeaderboard}
                    totalRanked={totalRankedThisWeek}
                    followState={followState}
                  />
                </section>
              )}
              <CommunityWinsFeed gamification={gamification} preview />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-5">
          <CommunityArenaRibbon gamification={gamification} />

          {gamification.weeklyRival && gamification.userScore != null && (
            <CommunityRivalShowdown
              rival={gamification.weeklyRival}
              userRank={gamification.userRank}
              userScore={gamification.userScore}
            />
          )}

          <CommunityQuickActions
            unreadNotificationCount={unreadNotificationCount}
            showSquad
            crewProgressLabel={crewProgressLabel}
            onCheerWins={scrollToWins}
            onSquad={scrollToSquad}
            onAlerts={scrollToAlerts}
          />

          <CommunityActivityPulse
            activePeerCount={gamification.activePeerCount}
            latestWin={latestWin}
          />

          {gamification.weeklyRecap && (
            <WeeklyCommunityRecapCard recap={gamification.weeklyRecap} />
          )}

          {gamification.league?.seasonRecap && (
            <SeasonRecapCard recap={gamification.league.seasonRecap} />
          )}

          {weeklyChallenge && (
            <WeeklyChallengeCard challenge={weeklyChallenge} />
          )}

          <section
            id="community-squad"
            className="scroll-mt-4 flex flex-col gap-4 sm:gap-5"
          >
            <CrewPanel crew={crew} crewChallenge={crewChallenge} />
            {crew && <CrewWinsFeed wins={crewWins} />}
            <FriendsLeaderboard friends={friendsLeaderboard} />
          </section>

          {(fullLeaderboard.length > 0 || gamification.userRank != null) && (
            <section
              id="community-standings"
              className="scroll-mt-4 rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5"
            >
              <CommunityPodiumStandings
                gamification={gamification}
                entries={fullLeaderboard}
                totalRanked={totalRankedThisWeek}
                followState={followState}
              />
            </section>
          )}

          <section id="community-wins" className="scroll-mt-4">
            <CommunityWinsFeed gamification={gamification} />
          </section>

          {gamification.isModerator && communityMetrics && (
            <CommunityOpsMetricsPanel metrics={communityMetrics} />
          )}

          {gamification.isModerator && moderationQueue && (
            <CommunityModerationPanel queue={moderationQueue} />
          )}

          <section id="community-notifications" className="scroll-mt-4">
            <CommunityNotificationsPanel
              notifications={notifications}
              unreadCount={unreadNotificationCount}
            />
          </section>

          {gamification.league && (
            <HallOfFameCard
              entries={gamification.league.hallOfFame}
              bucketLabel={gamification.bucketLabel}
            />
          )}

          {gamification.habitBreakdown && (
            <HabitScoreBreakdownCard
              breakdown={gamification.habitBreakdown}
              compact
            />
          )}

          <p className="text-center text-[11px] text-forge-muted">
            Top 30% promote at month end ·{" "}
            <Link
              href="/profile#gamification"
              className="text-forge-ember underline-offset-2 hover:underline"
            >
              Community settings
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
