import { CommunityPageClient } from "@/components/community/community-page-client";
import { getCommunityPageData } from "@/lib/coaching/service";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { appPagePadding } from "@/components/layout/page-layout";
import { getMemberContext } from "@/lib/auth/member-context";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
import { redirect } from "next/navigation";

export default async function CommunityPage() {
  const member = await getMemberContext();

  if (!member) {
    redirect("/login");
  }

  const userId = member.effectiveUserId;
  const subscription = await getSubscriptionForUser(userId);
  const { records } = await getServerSessionRecords(userId, 120);
  const data = await getCommunityPageData(userId, subscription, records);

  return (
    <div className={appPagePadding}>
      <CommunityPageClient data={data} />
    </div>
  );
}
