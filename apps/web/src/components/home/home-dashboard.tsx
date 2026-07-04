"use client";

import { HomeDomainCarousel } from "@/components/home/home-domain-carousel";
import { HomeHero } from "@/components/home/home-hero";
import { WeighInReminderBanner } from "@/components/measurements/weigh-in-reminder-banner";
import type { HomeDashboardData } from "@/lib/home/types";

interface HomeDashboardProps {
  data: HomeDashboardData;
  encouragement: string;
}

export function HomeDashboard({ data, encouragement }: HomeDashboardProps) {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {data.weighInReminder && (
        <WeighInReminderBanner reminder={data.weighInReminder} variant="home" />
      )}

      <HomeHero
        hero={data.hero}
        weeklyStats={data.weeklyStats}
        encouragement={encouragement}
        birthdayMessage={data.birthdayMessage}
      />

      <HomeDomainCarousel data={data} />

      {!data.workoutsTableReady && (
        <p className="rounded-xl border border-forge-gold/30 bg-forge-surface-raised px-4 py-3 text-sm text-forge-muted">
          Apply the Phase 3 workout migration to sync completed sessions to your
          dashboard.
        </p>
      )}
    </div>
  );
}
