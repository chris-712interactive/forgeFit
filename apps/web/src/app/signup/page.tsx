import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { LegalFooter } from "@/components/legal/legal-document";
import {
  PARTNER_REF_COOKIE,
  parsePartnerRefCookie,
} from "@/lib/partners/cookie";
import {
  getActivePartnerBySlug,
  getActivePartnerCode,
} from "@/lib/partners/resolve";
import { getSiteUrl } from "@/lib/seo/site-url";

interface SignupPageProps {
  searchParams: Promise<{ ref?: string; code?: string }>;
}

async function resolvePartnerRedirect(
  ref: string | undefined,
  code: string | undefined
): Promise<string | null> {
  try {
    if (ref) {
      const partner = await getActivePartnerBySlug(ref);
      if (partner) {
        const site = getSiteUrl();
        const qs = new URLSearchParams();
        if (code) qs.set("code", code);
        const suffix = qs.toString() ? `?${qs}` : "";
        return `${site}/r/${partner.slug}${suffix}`;
      }
    }
    if (code) {
      const coded = await getActivePartnerCode(code);
      if (coded) {
        const site = getSiteUrl();
        return `${site}/r/${coded.partner.slug}?code=${encodeURIComponent(coded.code)}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Direct links like /signup?ref=slug or ?code=CODE (without /r/) are bounced
 * through the tracked redirect once — skipped when the partner cookie is already set.
 */
export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const ref = params.ref?.trim();
  const code = params.code?.trim();
  const cookieStore = await cookies();
  const existingRef = parsePartnerRefCookie(
    cookieStore.get(PARTNER_REF_COOKIE)?.value
  );

  if (!existingRef && (ref || code)) {
    const target = await resolvePartnerRedirect(ref, code);
    if (target) {
      redirect(target);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-forge-surface px-6 py-10">
      <Link href="/" className="mb-8 inline-block">
        <img src="/logo.svg" alt="ForgeRep" className="h-12 w-auto" />
      </Link>

      <h1 className="font-display text-2xl font-bold text-forge-text">
        Start your journey
      </h1>
      <p className="mt-2 text-forge-muted">
        Create a free account — your program is waiting.
      </p>

      <div className="mt-8">
        <AuthForm mode="signup" />
      </div>

      <p className="mt-8 text-center text-sm text-forge-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-forge-ember">
          Sign in
        </Link>
      </p>

      <LegalFooter className="mt-6 text-center" />
    </div>
  );
}
