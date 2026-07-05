import { LandingContent } from "@/components/marketing/landing-content";
import { getPostAuthPath } from "@/lib/auth/post-auth-path";
import { buildLandingMetadata } from "@/lib/seo/landing-metadata";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = buildLandingMetadata();

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  if (params.code) {
    const callbackQuery = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") {
        callbackQuery.set(key, value);
      } else if (Array.isArray(value) && value[0]) {
        callbackQuery.set(key, value[0]);
      }
    }
    redirect(`/auth/callback?${callbackQuery.toString()}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const destination = await getPostAuthPath(supabase, user.id);
    redirect(destination);
  }

  return <LandingContent />;
}
