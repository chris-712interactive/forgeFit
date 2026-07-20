import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  PARTNER_REF_COOKIE,
  parsePartnerRefCookie,
} from "@/lib/partners/cookie";
import { stampUserAttributionFromRef } from "@/lib/partners/stamp";
import { createClient } from "@/lib/supabase/server";

/** Authenticated claim of partner cookie / promo code onto the current user. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let code: string | null = null;
  try {
    const body = (await request.json()) as { code?: string };
    code = body.code?.trim() || null;
  } catch {
    code = null;
  }

  const cookieStore = await cookies();
  const ref = parsePartnerRefCookie(
    cookieStore.get(PARTNER_REF_COOKIE)?.value
  );

  const result = await stampUserAttributionFromRef({
    userId: user.id,
    ref,
    code,
  });

  return NextResponse.json(result);
}
