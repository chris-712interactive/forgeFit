import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function adminIdsFromEnv(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

export function isAdminUser(input: {
  userId: string;
  profileFlag?: boolean | null;
}): boolean {
  if (input.profileFlag) return true;
  return adminIdsFromEnv().has(input.userId);
}

export async function getAdminProfileFlag(
  userId: string
): Promise<boolean | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    return data?.is_admin ?? null;
  } catch {
    return null;
  }
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return isAdminUser({
    userId: user.id,
    profileFlag: profile?.is_admin,
  });
}

/** Redirects to login if unauthenticated; 404 if authenticated but not admin. */
export async function requireAdminUser(): Promise<{
  userId: string;
  email: string | undefined;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !isAdminUser({
      userId: user.id,
      profileFlag: profile?.is_admin,
    })
  ) {
    notFound();
  }

  return { userId: user.id, email: user.email };
}

/** For API routes — returns null when unauthorized (caller returns 404). */
export async function getAdminApiActor(): Promise<{
  userId: string;
  email: string | undefined;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !isAdminUser({
      userId: user.id,
      profileFlag: profile?.is_admin,
    })
  ) {
    return null;
  }

  return { userId: user.id, email: user.email };
}
