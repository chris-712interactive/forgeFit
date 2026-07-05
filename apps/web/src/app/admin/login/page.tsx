import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AuthForm } from "@/components/auth/auth-form";
import { isCurrentUserAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user ? await isCurrentUserAdmin() : false;

  if (user && isAdmin) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-forge-surface px-6 py-10 lg:px-12">
      <div className="mx-auto w-full max-w-md">
        <Link href="/admin/login" className="mb-8 inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-forge-ember to-forge-gold font-display text-sm font-extrabold text-white">
            F
          </div>
          <div>
            <p className="font-display text-sm font-bold text-forge-text">ForgeRep</p>
            <p className="text-xs text-forge-muted">Admin Console</p>
          </div>
        </Link>

        <h1 className="font-display text-2xl font-bold text-forge-text">
          Operator sign in
        </h1>
        <p className="mt-2 text-sm text-forge-muted">
          Admin access only. Member accounts use{" "}
          <Link href="/login" className="font-medium text-forge-ember hover:underline">
            /login
          </Link>
          .
        </p>

        <div className="mt-8">
          {user && !isAdmin ? (
            <div className="space-y-4 rounded-2xl border border-forge-coral/30 bg-forge-coral/5 p-5">
              <p className="text-sm text-forge-text">
                Signed in as{" "}
                <span className="font-medium">{user.email ?? "this account"}</span>, which
                does not have admin access.
              </p>
              <p className="text-sm text-forge-muted">
                Sign out and sign in with an operator account, or use{" "}
                <Link href="/login" className="font-medium text-forge-ember hover:underline">
                  member login
                </Link>{" "}
                for the app.
              </p>
              <SignOutButton />
            </div>
          ) : (
            <AuthForm mode="login" postAuthPath="/admin" defaultRedirect="/admin" />
          )}
        </div>
      </div>
    </div>
  );
}
