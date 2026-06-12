import { ProFeatureSection } from "@/components/billing/pro-feature-section";
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
        Quick macro logging against your evidence-based targets — no ingredient
        hunt required.
      </p>

      {summary ? (
        <div className={`${appHeaderGap} space-y-6`}>
          <ProFeatureSection
            title="Nutrition adherence"
            description="How often you hit protein and calorie targets over 7, 30, and 90 days."
            unlocked={adherenceUnlocked}
          >
            <NutritionAdherenceCard adherence={adherence} />
          </ProFeatureSection>

          <NutritionDiary
            initialSummary={summary}
            recentEntries={recentEntries}
            yesterdayEntryCount={yesterdayEntryCount}
            yesterdayDate={yesterday}
            restaurantSearchUnlocked={restaurantSearchUnlocked}
          />
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
