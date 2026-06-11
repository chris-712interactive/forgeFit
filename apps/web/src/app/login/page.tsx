import Link from "next/link";
import { AlreadySignedIn } from "@/components/auth/already-signed-in";
import { LegalFooter } from "@/components/legal/legal-document";
import { AuthForm } from "@/components/auth/auth-form";
import { getPostAuthPath } from "@/lib/auth/post-auth-path";
import { createClient } from "@/lib/supabase/server";

interface LoginPageProps {
  searchParams: Promise<{ deleted?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const accountDeleted = params.deleted === "1";
  const continueHref = user ? await getPostAuthPath(supabase, user.id) : null;

  return (
    <div className="flex min-h-dvh flex-col bg-forge-surface px-6 py-10">
      <Link href="/" className="mb-8 inline-block">
        <img src="/logo.svg" alt="forgeFit" className="h-12 w-auto" />
      </Link>

      <h1 className="font-display text-2xl font-bold text-forge-text">
        Welcome back
      </h1>
      <p className="mt-2 text-forge-muted">
        Sign in to continue forging your best self.
      </p>

      {accountDeleted && (
        <p className="mt-4 rounded-xl border border-forge-success/30 bg-forge-success/10 px-4 py-3 text-sm text-forge-success">
          Your account and data have been permanently deleted.
        </p>
      )}

      <div className="mt-8">
        {user && continueHref ? (
          <AlreadySignedIn
            email={user.email}
            continueHref={continueHref}
            continueLabel={
              continueHref === "/home"
                ? "Go to dashboard"
                : continueHref === "/disclaimer"
                  ? "Review health disclaimer"
                  : "Continue onboarding"
            }
          />
        ) : (
          <AuthForm mode="login" />
        )}
      </div>

      {!user && (
        <p className="mt-8 text-center text-sm text-forge-muted">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-forge-ember">
            Create an account
          </Link>
        </p>
      )}

      <LegalFooter className="mt-8 text-center" />
    </div>
  );
}
