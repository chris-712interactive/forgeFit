import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getImpersonationFromRequestCookies,
  type ImpersonationPayload,
} from "@/lib/admin/impersonation";
import { isAdminUser, getAdminProfileFlag } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export interface MemberContext {
  user: User;
  effectiveUserId: string;
  isImpersonating: boolean;
  impersonation: ImpersonationPayload | null;
  impersonatedEmail: string | null;
}

export async function getMemberContext(): Promise<MemberContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profileFlag = await getAdminProfileFlag(user.id);
  if (!isAdminUser({ userId: user.id, profileFlag })) {
    return {
      user,
      effectiveUserId: user.id,
      isImpersonating: false,
      impersonation: null,
      impersonatedEmail: null,
    };
  }

  const impersonation = await getImpersonationFromRequestCookies(user.id);
  if (!impersonation) {
    return {
      user,
      effectiveUserId: user.id,
      isImpersonating: false,
      impersonation: null,
      impersonatedEmail: null,
    };
  }

  let impersonatedEmail: string | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("email")
      .eq("id", impersonation.targetUserId)
      .maybeSingle();
    impersonatedEmail = (data?.email as string | null) ?? null;
  } catch {
    impersonatedEmail = null;
  }

  return {
    user,
    effectiveUserId: impersonation.targetUserId,
    isImpersonating: true,
    impersonation,
    impersonatedEmail,
  };
}

export async function getImpersonationMutationBlock(): Promise<{
  error: string;
} | null> {
  const context = await getMemberContext();
  if (!context?.isImpersonating) return null;
  return {
    error: "Read-only while viewing as another member. Exit impersonation to make changes.",
  };
}
