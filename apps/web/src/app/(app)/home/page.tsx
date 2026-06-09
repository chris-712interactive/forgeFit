import { EncouragementBanner } from "@/components/home/encouragement-banner";
import { HomeMacroTracker } from "@/components/home/home-macro-tracker";
import { WeekAccountability } from "@/components/home/week-accountability";
import { WeeklyWorkStatsGrid } from "@/components/home/weekly-work-stats";
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
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-forge-gold">
        Home
      </p>
      <h1 className="font-display mt-1 text-3xl font-bold text-forge-text">
        {greeting}
      </h1>

      <div className="mt-6 space-y-6">
        <EncouragementBanner message={data.encouragement} />

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
