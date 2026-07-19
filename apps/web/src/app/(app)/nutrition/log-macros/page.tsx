import { LogMacrosScreen } from "@/components/nutrition/log-macros-screen";
import { parseNutritionMealParam } from "@/lib/nutrition/date-param";
import { getMemberContext } from "@/lib/auth/member-context";
import { getNutritionPageData } from "@/lib/nutrition/page-data";
import { redirect } from "next/navigation";

export default async function LogMacrosPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; meal?: string }>;
}) {
  const params = await searchParams;
  const member = await getMemberContext();

  if (!member) {
    redirect("/nutrition");
  }

  const pageData = await getNutritionPageData(member.effectiveUserId, params.date);

  if (!pageData.summary) {
    redirect("/nutrition");
  }

  return (
    <LogMacrosScreen
      summary={pageData.summary}
      recentEntries={pageData.recentEntries}
      selectedDate={pageData.selectedDate}
      todayIso={pageData.todayIso}
      yesterdayIso={pageData.yesterdayIso}
      initialMealType={parseNutritionMealParam(params.meal)}
      savedMealsUnlocked={pageData.savedMealsUnlocked}
    />
  );
}
