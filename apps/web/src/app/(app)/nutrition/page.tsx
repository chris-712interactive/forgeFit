import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import { CollapsibleSection } from "@/components/layout/collapsible-section";
import {
  appHeaderGap,
  appPagePadding,
  appSectionStack,
} from "@/components/layout/page-layout";
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

  const [summary, recentEntries, yesterdayEntryCount, subscription] = user
    ? await Promise.all([
        getDailyNutritionSummary(user.id),
        getRecentMacroEntries(user.id),
        getDayLogCount(user.id, yesterday),
        getSubscriptionForUser(user.id),
      ])
    : [null, [], 0, null];

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
      <p className="mt-1 text-sm text-forge-muted">
        Log today&apos;s macros — search and meal ideas when you need them.
      </p>

      {summary ? (
        <div className={`${appHeaderGap} ${appSectionStack}`}>
          <NutritionDiary
            initialSummary={summary}
            recentEntries={recentEntries}
            yesterdayEntryCount={yesterdayEntryCount}
            yesterdayDate={yesterday}
            restaurantSearchUnlocked={restaurantSearchUnlocked}
          />

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
    </div>
  );
}
