import { CommunityJoinClient } from "@/components/community/community-join-client";
import { appPagePadding } from "@/components/layout/page-layout";
import { getCrewPreviewByCode } from "@/lib/coaching/community-crews";
import { getMemberContext } from "@/lib/auth/member-context";
import { redirect } from "next/navigation";

interface CommunityJoinPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function CommunityJoinPage({
  searchParams,
}: CommunityJoinPageProps) {
  const member = await getMemberContext();

  if (!member) {
    redirect("/login");
  }

  const params = await searchParams;
  const initialCode = (params.code ?? "").trim().toUpperCase();
  const preview =
    initialCode.length >= 4
      ? await getCrewPreviewByCode(member.effectiveUserId, initialCode)
      : null;

  return (
    <div className={appPagePadding}>
      <CommunityJoinClient
        initialCode={initialCode}
        previewName={preview?.name ?? null}
        previewMemberCount={preview?.memberCount ?? null}
      />
    </div>
  );
}
