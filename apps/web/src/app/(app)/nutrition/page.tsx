import { NutritionDiary } from "@/components/nutrition/nutrition-diary";
import { getDailyNutritionSummary } from "@/lib/nutrition/service";
import { createClient } from "@/lib/supabase/server";

export default async function NutritionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const summary = user ? await getDailyNutritionSummary(user.id) : null;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="font-display text-2xl font-bold text-forge-text">
        Nutrition
      </h1>
      <p className="mt-2 text-forge-muted">
        Log meals and track macros against your evidence-based targets.
      </p>

      {summary ? (
        <div className="mt-6">
          <NutritionDiary initialSummary={summary} />
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center">
          <p className="text-forge-muted">Sign in to use your nutrition diary.</p>
        </div>
      )}
    </div>
  );
}
