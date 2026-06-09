import { appHeaderGap, appPagePadding } from "@/components/layout/page-layout";
import { NutritionDiary } from "@/components/nutrition/nutrition-diary";
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
        <div className={appHeaderGap}>
          <NutritionDiary
            initialSummary={summary}
            recentEntries={recentEntries}
            yesterdayEntryCount={yesterdayEntryCount}
            yesterdayDate={yesterday}
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
