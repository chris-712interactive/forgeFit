import {
  isSignupConversion,
  withSignupConversionParam,
} from "@/lib/auth/is-signup-conversion";
import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import { consumeAuthRedirectCookie } from "@/lib/auth/redirect-cookie";
import { resolveAuthRedirect } from "@/lib/auth/redirect-path";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  await ensureUserProfile(supabase, data.user);
  const nextFromQuery = searchParams.get("next");
  const nextFromCookie = await consumeAuthRedirectCookie();
  const next = nextFromQuery ?? nextFromCookie;
  const destination = await resolveAuthRedirect(supabase, data.user.id, next);
  const redirectPath = isSignupConversion(data.user)
    ? withSignupConversionParam(destination)
    : destination;

  return NextResponse.redirect(`${origin}${redirectPath}`);
}
