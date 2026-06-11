import { EncouragementBanner } from "@/components/home/encouragement-banner";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import { HomeMacroTracker } from "@/components/home/home-macro-tracker";
import { WeekAccountability } from "@/components/home/week-accountability";
import { WeeklyWorkStatsGrid } from "@/components/home/weekly-work-stats";
import { ExperiencePromotionBanner } from "@/components/progression/experience-promotion-banner";
import { TrainingConsistencyCard } from "@/components/progression/training-consistency-card";
import {
  appHeaderGap,
  appPagePadding,
  appSectionStack,
} from "@/components/layout/page-layout";
import { getHomeDashboardData } from "@/lib/home/service";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-6 py-8">
        <p className="text-forge-muted">Sign in to view your dashboard.</p>
      </div>
    );
  }

  const data = await getHomeDashboardData(user.id);

  const greeting = data.displayName
    ? `Hey, ${data.displayName.split(" ")[0]}`
    : "Let's forge it";

  return (
    <div className={appPagePadding}>
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-forge-gold">
        Home
      </p>
      <h1 className="font-display mt-1 text-3xl font-bold text-forge-text">
        {greeting}
      </h1>

      <div className={`${appHeaderGap} ${appSectionStack}`}>
        <EncouragementBanner message={data.encouragement} />

        <PwaInstallPrompt />

        {data.promotion?.showNudge && (
          <ExperiencePromotionBanner evaluation={data.promotion} />
        )}

        {data.promotion && !data.promotion.showNudge && (
          <TrainingConsistencyCard evaluation={data.promotion} />
        )}

        <HomeMacroTracker summary={data.nutrition} />

        {data.plan ? (
          <>
            <WeekAccountability
              stats={data.weeklyStats}
              nextSessionDayIndex={data.nextSessionDayIndex}
              nextSessionName={data.nextSessionName}
            />
            <WeeklyWorkStatsGrid stats={data.weeklyStats} />
          </>
        ) : (
          <p className="text-sm text-forge-muted">
            Generate your program to unlock weekly tracking.
          </p>
        )}

        {!data.workoutsTableReady && (
          <p className="rounded-xl border border-forge-gold/30 bg-forge-surface-raised px-4 py-3 text-sm text-forge-muted">
            Apply the Phase 3 workout migration to sync completed sessions to
            your dashboard.
          </p>
        )}
      </div>
    </div>
  );
}
