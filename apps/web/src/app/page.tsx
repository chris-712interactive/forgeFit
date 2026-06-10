import { LandingContent } from "@/components/marketing/landing-content";
import { getPostAuthPath } from "@/lib/auth/post-auth-path";
import { buildLandingMetadata } from "@/lib/seo/landing-metadata";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = buildLandingMetadata();

export default async function Home() {
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
