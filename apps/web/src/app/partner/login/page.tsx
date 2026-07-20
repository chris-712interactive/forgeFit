import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AuthForm } from "@/components/auth/auth-form";
import { getPartnerPortalContext } from "@/lib/partners/portal";
import { createClient } from "@/lib/supabase/server";

export default async function PartnerLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const portal = user ? await getPartnerPortalContext() : null;
  if (user && portal) {
    redirect("/partner");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-forge-surface px-6 py-10 lg:px-12">
      <div className="mx-auto w-full max-w-md">
        <Link href="/partner/login" className="mb-8 inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-forge-ember to-forge-gold font-display text-sm font-extrabold text-white">
            F
          </div>
          <div>
            <p className="font-display text-sm font-bold text-forge-text">
              ForgeRep
            </p>
            <p className="text-xs text-forge-muted">Partner portal</p>
          </div>
        </Link>

        <h1 className="font-display text-2xl font-bold text-forge-text">
          Partner sign in
        </h1>
        <p className="mt-2 text-sm text-forge-muted">
          Read-only stats for your tracked link. Member app login is{" "}
          <Link href="/login" className="font-medium text-forge-ember hover:underline">
            /login
          </Link>
          .
        </p>

        <div className="mt-8">
          {user && !portal ? (
            <div className="space-y-4 rounded-2xl border border-forge-coral/30 bg-forge-coral/5 p-5">
              <p className="text-sm text-forge-text">
                Signed in as{" "}
                <span className="font-medium">{user.email ?? "this account"}</span>
                , which is not linked to a partner portal.
              </p>
              <p className="text-sm text-forge-muted">
                Ask ForgeRep to grant portal access to this email, then refresh.
              </p>
              <SignOutButton />
            </div>
          ) : (
            <AuthForm
              mode="login"
              postAuthPath="/partner"
              defaultRedirect="/partner"
            />
          )}
        </div>
      </div>
    </div>
  );
}
