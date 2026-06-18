import { CommunityPageClient } from "@/components/community/community-page-client";
import { getCommunityPageData } from "@/lib/coaching/service";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { appPagePadding } from "@/components/layout/page-layout";
import { createClient } from "@/lib/supabase/server";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
import { redirect } from "next/navigation";

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const subscription = await getSubscriptionForUser(user.id);
  const { records } = await getServerSessionRecords(user.id, 120);
  const data = await getCommunityPageData(user.id, subscription, records);

  return (
    <div className={appPagePadding}>
      <CommunityPageClient data={data} />
    </div>
  );
}
