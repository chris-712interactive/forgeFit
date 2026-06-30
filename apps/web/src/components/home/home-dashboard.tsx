"use client";

import { WeighInReminderBanner } from "@/components/measurements/weigh-in-reminder-banner";
import { HomeIntegratedLoop } from "@/components/home/home-integrated-loop";
import { HomeProgressShortcut } from "@/components/home/home-progress-shortcut";
import { CommunitySection } from "@/components/home/community-section";
import { HomeNotificationsStrip } from "@/components/home/home-notifications-strip";
import { BirthdayBanner } from "@/components/home/birthday-banner";
import { HomeTodaySnapshot } from "@/components/home/home-today-snapshot";
import { ProInsightsStrip } from "@/components/home/pro-insights-strip";
import { WeeklyScorecardStrip } from "@/components/home/weekly-scorecard-strip";
import { WeeklyWorkStatsGrid } from "@/components/home/weekly-work-stats";
import { CollapsibleSection } from "@/components/layout/collapsible-section";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import type { HomeDashboardData } from "@/lib/home/types";

interface HomeDashboardProps {
  data: HomeDashboardData;
  encouragement: string;
}

export function HomeDashboard({ data, encouragement }: HomeDashboardProps) {
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

      {data.weighInReminder && (
        <WeighInReminderBanner reminder={data.weighInReminder} variant="home" />
      )}

      {data.plan ? (
        <HomeIntegratedLoop
          plan={data.plan}
          stats={data.weeklyStats}
          nutrition={data.nutrition}
          nextSessionDayIndex={data.nextSessionDayIndex}
          nextSessionName={data.nextSessionName}
        />
      ) : (
        <p className="text-sm text-forge-muted">
          Generate your program to unlock weekly tracking.
        </p>
      )}

      <HomeTodaySnapshot activity={data.activity} sleep={data.sleep} />

      <HomeProgressShortcut />

      {data.weeklyScorecard && (
        <WeeklyScorecardStrip scorecard={data.weeklyScorecard} compact />
      )}

      {data.proInsights.length > 0 && (
        <ProInsightsStrip insights={data.proInsights} />
      )}

      <PwaInstallPrompt />

      {data.plan && hasWeeklyDetail && (
        <CollapsibleSection title="Body of work" hint="Tap to expand">
          <WeeklyWorkStatsGrid stats={data.weeklyStats} embedded />
        </CollapsibleSection>
      )}

      {data.gamification.unreadNotificationCount > 0 && (
        <HomeNotificationsStrip
          notifications={data.gamification.recentNotifications}
          unreadCount={data.gamification.unreadNotificationCount}
        />
      )}

      <CommunitySection gamification={data.gamification} />

      {!data.workoutsTableReady && (
        <p className="rounded-xl border border-forge-gold/30 bg-forge-surface-raised px-4 py-3 text-sm text-forge-muted">
          Apply the Phase 3 workout migration to sync completed sessions to your
          dashboard.
        </p>
      )}
    </div>
  );
}
