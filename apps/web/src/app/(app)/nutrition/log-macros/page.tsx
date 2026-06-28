import { LogMacrosScreen } from "@/components/nutrition/log-macros-screen";
import { getNutritionPageData } from "@/lib/nutrition/page-data";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LogMacrosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/nutrition");
  }

  const { summary, recentEntries } = await getNutritionPageData(user.id);

  if (!summary) {
    redirect("/nutrition");
  }

  return (
    <LogMacrosScreen summary={summary} recentEntries={recentEntries} />
  );
}
