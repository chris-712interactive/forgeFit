import Link from "next/link";
import { AlreadySignedIn } from "@/components/auth/already-signed-in";
import { AuthForm } from "@/components/auth/auth-form";
import { getPostAuthPath } from "@/lib/auth/post-auth-path";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

      <div className="mt-8">
        {user && continueHref ? (
          <AlreadySignedIn
            email={user.email}
            continueHref={continueHref}
            continueLabel={
              continueHref === "/home"
                ? "Go to dashboard"
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
    </div>
  );
}
