import { LogMacrosScreen } from "@/components/nutrition/log-macros-screen";
import { getNutritionPageData } from "@/lib/nutrition/page-data";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LogMacrosPage({
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
    <LogMacrosScreen
      summary={pageData.summary}
      recentEntries={pageData.recentEntries}
      selectedDate={pageData.selectedDate}
      todayIso={pageData.todayIso}
      yesterdayIso={pageData.yesterdayIso}
    />
  );
}
