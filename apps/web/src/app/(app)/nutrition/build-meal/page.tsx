import { BuildMealScreen } from "@/components/nutrition/build-meal-screen";
import { getNutritionPageData } from "@/lib/nutrition/page-data";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function BuildMealPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/nutrition");
  }

  const { summary } = await getNutritionPageData(user.id);

  if (!summary) {
    redirect("/nutrition");
  }

  return <BuildMealScreen loggedDate={summary.date} />;
}
