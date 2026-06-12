import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { appHeaderGap, appPagePadding } from "@/components/layout/page-layout";
import { NutritionAdherenceCard } from "@/components/nutrition/nutrition-adherence-card";
import { NutritionDiary } from "@/components/nutrition/nutrition-diary";
import { getNutritionAdherenceForUser } from "@/lib/analytics/service";
import { hasFeature } from "@/lib/billing/gates";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import {
  getDailyNutritionSummary,
  getDayLogCount,
  getRecentMacroEntries,
  yesterdayIsoDate,
} from "@/lib/nutrition/service";
import { createClient } from "@/lib/supabase/server";

export default async function NutritionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const yesterday = yesterdayIsoDate();

  const summary = user ? await getDailyNutritionSummary(user.id) : null;
  const recentEntries = user ? await getRecentMacroEntries(user.id) : [];
  const yesterdayEntryCount = user
    ? await getDayLogCount(user.id, yesterday)
    : 0;
  const subscription = user ? await getSubscriptionForUser(user.id) : null;
  const adherence =
    user && subscription
      ? await getNutritionAdherenceForUser(user.id, subscription)
      : null;
  const adherenceUnlocked =
    subscription != null && hasFeature(subscription, "nutrition_adherence");
  const restaurantSearchUnlocked =
    subscription != null && hasFeature(subscription, "restaurant_search");

  return (
    <div className={appPagePadding}>
      <h1 className="font-display text-2xl font-bold text-forge-text">
        Nutrition
      </h1>
      <p className="mt-2 text-forge-muted">
        Log macros at a glance — presets, restaurants, and meal ideas when you
        need them.
      </p>

      {summary ? (
        <div className={`${appHeaderGap} space-y-6`}>
          <NutritionDiary
            initialSummary={summary}
            recentEntries={recentEntries}
            yesterdayEntryCount={yesterdayEntryCount}
            yesterdayDate={yesterday}
            restaurantSearchUnlocked={restaurantSearchUnlocked}
          />

          <details className="group rounded-2xl border border-[var(--border)] bg-forge-surface-raised">
            <summary className="cursor-pointer list-none px-4 py-4 font-display text-sm font-semibold text-forge-text sm:px-5 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                Nutrition adherence
                <span className="text-xs font-normal text-forge-muted group-open:hidden">
                  Pro · tap to expand
                </span>
              </span>
            </summary>
            <div className="border-t border-[var(--border)] px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
              <p className="text-xs text-forge-muted">
                How often you hit protein and calorie targets over 7, 30, and 90
                days.
              </p>
              <div className="mt-4">
                {adherenceUnlocked ? (
                  <NutritionAdherenceCard adherence={adherence} />
                ) : (
                  <UpgradePrompt
                    title="Unlock nutrition adherence"
                    description="Upgrade to Pro for long-horizon analytics on your training and nutrition."
                    suggestedTier="pro"
                  />
                )}
              </div>
            </div>
          </details>
        </div>
      ) : (
        <div
          className={`${appHeaderGap} rounded-2xl border border-dashed border-[var(--border)] p-8 text-center`}
        >
          <p className="text-forge-muted">Sign in to use your nutrition diary.</p>
        </div>
      )}
    </div>
  );
}
