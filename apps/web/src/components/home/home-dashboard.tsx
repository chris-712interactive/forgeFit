"use client";

import { CommunityWinsFeed } from "@/components/coaching/community-wins-feed";
import { LeaderboardCard } from "@/components/coaching/leaderboard-card";
import { CollapsibleSection } from "@/components/layout/collapsible-section";
import { BirthdayBanner } from "@/components/home/birthday-banner";
import { HomeTodaySnapshot } from "@/components/home/home-today-snapshot";
import { ProInsightsStrip } from "@/components/home/pro-insights-strip";
import { WeekAccountability } from "@/components/home/week-accountability";
import { WeeklyWorkStatsGrid } from "@/components/home/weekly-work-stats";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import type { HomeDashboardData } from "@/lib/home/types";

interface HomeDashboardProps {
  data: HomeDashboardData;
  encouragement: string;
}

export function HomeDashboard({ data, encouragement }: HomeDashboardProps) {
  const showCommunity =
    data.gamification.unlocked && data.gamification.optedIn;
  const hasWeeklyDetail =
    data.weeklyStats.totalSets > 0 ||
    data.weeklyStats.cardioMinutes > 0 ||
    data.weeklyStats.trainingMinutes > 0;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {data.birthdayMessage ? (
        <BirthdayBanner message={data.birthdayMessage} />
      ) : (
        <p className="rounded-xl border border-forge-ember/25 bg-forge-ember/5 px-4 py-3 text-sm leading-relaxed text-forge-text">
          {encouragement}
        </p>
      )}

      {data.plan ? (
        <WeekAccountability
          stats={data.weeklyStats}
          nextSessionDayIndex={data.nextSessionDayIndex}
          nextSessionName={data.nextSessionName}
        />
      ) : (
        <p className="text-sm text-forge-muted">
          Generate your program to unlock weekly tracking.
        </p>
      )}

      <HomeTodaySnapshot
        nutrition={data.nutrition}
        activity={data.activity}
        sleep={data.sleep}
      />

      {data.proInsights.length > 0 && (
        <ProInsightsStrip insights={data.proInsights} />
      )}

      <PwaInstallPrompt />

      {data.plan && hasWeeklyDetail && (
        <CollapsibleSection title="Body of work" hint="Tap to expand">
          <WeeklyWorkStatsGrid stats={data.weeklyStats} embedded />
        </CollapsibleSection>
      )}

      {showCommunity && (
        <CollapsibleSection title="Community" hint="Leaderboard & wins">
          <div className="space-y-4">
            <LeaderboardCard gamification={data.gamification} embedded />
            <CommunityWinsFeed gamification={data.gamification} />
          </div>
        </CollapsibleSection>
      )}

      {!data.workoutsTableReady && (
        <p className="rounded-xl border border-forge-gold/30 bg-forge-surface-raised px-4 py-3 text-sm text-forge-muted">
          Apply the Phase 3 workout migration to sync completed sessions to your
          dashboard.
        </p>
      )}
    </div>
  );
}
