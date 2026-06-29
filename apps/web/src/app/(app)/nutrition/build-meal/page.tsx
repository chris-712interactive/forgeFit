import { BuildMealScreen } from "@/components/nutrition/build-meal-screen";
import { getNutritionPageData } from "@/lib/nutrition/page-data";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function BuildMealPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/nutrition");
  }

  const pageData = await getNutritionPageData(user.id, params.date);

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
