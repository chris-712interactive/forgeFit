import { CommunityModerationPageClient } from "@/components/community/community-moderation-page-client";
import { appPagePadding } from "@/components/layout/page-layout";
import { getCommunityModerationPageData } from "@/lib/coaching/service";
import { getSubscriptionForUser } from "@/lib/billing/subscription";
import { getMemberContext } from "@/lib/auth/member-context";
import { getServerSessionRecords } from "@/lib/workouts/sessions-server";
import { redirect } from "next/navigation";

export default async function CommunityModerationPage() {
  const member = await getMemberContext();

  if (!member) {
    redirect("/login");
  }

  const userId = member.effectiveUserId;
  const subscription = await getSubscriptionForUser(userId);
  const { records } = await getServerSessionRecords(userId, 120);
  const data = await getCommunityModerationPageData(
    userId,
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
