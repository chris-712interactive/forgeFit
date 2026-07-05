import { BuildMealScreen } from "@/components/nutrition/build-meal-screen";
import { getMemberContext } from "@/lib/auth/member-context";
import { getNutritionPageData } from "@/lib/nutrition/page-data";
import { redirect } from "next/navigation";

export default async function BuildMealPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
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
    <BuildMealScreen
      loggedDate={pageData.summary.date}
      selectedDate={pageData.selectedDate}
      todayIso={pageData.todayIso}
      yesterdayIso={pageData.yesterdayIso}
      entryCount={pageData.summary.entries.length}
    />
  );
}
