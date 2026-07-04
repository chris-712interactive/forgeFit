import { CommunityModerationPageClient } from "@/components/community/community-moderation-page-client";
import { appPagePadding } from "@/components/layout/page-layout";
import { getCommunityModerationPageData } from "@/lib/coaching/service";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { createClient } from "@/lib/supabase/server";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
import { redirect } from "next/navigation";

export default async function CommunityModerationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const subscription = await getSubscriptionForUser(user.id);
  const { records } = await getServerSessionRecords(user.id, 120);
  const data = await getCommunityModerationPageData(
    user.id,
    subscription,
    records
  );

  if (!data) {
    redirect("/community");
  }

  return (
    <div className={appPagePadding}>
      <CommunityModerationPageClient data={data} />
    </div>
  );
}
