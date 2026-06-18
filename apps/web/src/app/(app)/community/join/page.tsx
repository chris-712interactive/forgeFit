import { CommunityJoinClient } from "@/components/community/community-join-client";
import { appPagePadding } from "@/components/layout/page-layout";
import { getCrewPreviewByCode } from "@/lib/coaching/community-crews";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface CommunityJoinPageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function CommunityJoinPage({
  searchParams,
}: CommunityJoinPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const initialCode = (params.code ?? "").trim().toUpperCase();
  const preview =
    initialCode.length >= 4
      ? await getCrewPreviewByCode(user.id, initialCode)
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
