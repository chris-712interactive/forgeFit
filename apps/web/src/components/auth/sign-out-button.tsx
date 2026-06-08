"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="min-h-[52px] w-full rounded-xl border border-[var(--border)] font-medium text-forge-muted"
    >
      Sign Out
    </button>
  );
}
