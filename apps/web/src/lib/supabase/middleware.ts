import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthPath } from "@/lib/auth/post-auth-path";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/auth") ||
    path.startsWith("/serwist") ||
    path.startsWith("/~offline");
  const isPublicRoute = path === "/";
  const isAppRoute =
    path.startsWith("/home") ||
    path.startsWith("/workout") ||
    path.startsWith("/nutrition") ||
    path.startsWith("/progress") ||
    path.startsWith("/profile") ||
    path.startsWith("/exercises") ||
    path.startsWith("/onboarding");

  if (!user && (isAppRoute || path.startsWith("/onboarding"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Only skip the landing page when onboarding is already complete.
  // /login and /signup stay reachable so users can sign in or switch accounts.
  if (user && path === "/") {
    const destination = await getPostAuthPath(supabase, user.id);
    if (destination === "/home") {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (user && !isPublicRoute && !isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    const onboardingComplete = profile?.onboarding_complete ?? false;

    if (!onboardingComplete && !path.startsWith("/onboarding")) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (onboardingComplete && path.startsWith("/onboarding")) {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
