import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { LegalFooter } from "@/components/legal/legal-document";

export default function SignupPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-forge-surface px-6 py-10">
      <Link href="/" className="mb-8 inline-block">
        <img src="/logo.svg" alt="forgeFit" className="h-12 w-auto" />
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
