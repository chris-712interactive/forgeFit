import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { CollapsibleSection } from "@/components/layout/collapsible-section";
import {
  appHeaderGap,
  appPagePadding,
  appSectionStack,
} from "@/components/layout/page-layout";
import { NutritionAdherenceCard } from "@/components/nutrition/nutrition-adherence-card";
import { NutritionDiary } from "@/components/nutrition/nutrition-diary";
import { NutritionFab } from "@/components/nutrition/nutrition-fab";
import { getNutritionAdherenceForUser } from "@/lib/analytics/service";
import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { getNutritionPageData } from "@/lib/nutrition/page-data";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

function NutritionDiaryFallback() {
  return (
    <div
      className={`${appHeaderGap} rounded-2xl border border-dashed border-[var(--border)] p-8 text-center`}
    >
      <p className="text-forge-muted">Loading your diary…</p>
    </div>
  );
}

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pageData = await getNutritionPageData(user?.id, params.date);
  const {
    summary,
    selectedDate,
    todayIso,
    yesterdayIso,
    isViewingToday,
    previousDayDate,
    previousDayEntryCount,
    yesterdayEntryCount,
    yesterdayDate,
    restaurantSearchUnlocked,
    tdeeDashboard,
  } = pageData;

  const subscription = user ? await getSubscriptionForUser(user.id) : null;
  const adherence =
    user && subscription
      ? await getNutritionAdherenceForUser(user.id, subscription)
      : null;
  const adherenceUnlocked =
    subscription != null && hasFeature(subscription, "nutrition_adherence");

  return (
    <div className={appPagePadding}>
      <h1 className="font-display text-2xl font-bold text-forge-text">
        Nutrition
      </h1>
      <p className="mt-1 text-sm text-forge-muted">
        {isViewingToday
          ? "Your daily totals and logged meals — tap + to add food."
          : "Catch up on a missed day — new entries save to the date you select."}
      </p>

      {summary ? (
        <div className={`${appHeaderGap} ${appSectionStack}`}>
          <Suspense fallback={<NutritionDiaryFallback />}>
            <NutritionDiary
              initialSummary={summary}
              recentEntries={pageData.recentEntries}
              selectedDate={selectedDate}
              todayIso={todayIso}
              yesterdayIso={yesterdayIso}
              isViewingToday={isViewingToday}
              previousDayDate={previousDayDate}
              previousDayEntryCount={previousDayEntryCount}
              yesterdayEntryCount={yesterdayEntryCount}
              yesterdayDate={yesterdayDate}
              restaurantSearchUnlocked={restaurantSearchUnlocked}
              tdeeDashboard={tdeeDashboard}
            />
          </Suspense>

          <CollapsibleSection title="Nutrition adherence" hint="Pro · 7/30/90 days">
            {adherenceUnlocked ? (
              <NutritionAdherenceCard adherence={adherence} />
            ) : (
              <UpgradePrompt
                title="Unlock nutrition adherence"
                description="Upgrade to Pro for long-horizon analytics on your training and nutrition."
                suggestedTier="pro"
              />
            )}
          </CollapsibleSection>
        </div>
      ) : (
        <div
          className={`${appHeaderGap} rounded-2xl border border-dashed border-[var(--border)] p-8 text-center`}
        >
          <p className="text-forge-muted">Sign in to use your nutrition diary.</p>
        </div>
      )}

      {summary ? <NutritionFab selectedDate={selectedDate} todayIso={todayIso} /> : null}
    </div>
  );
}
