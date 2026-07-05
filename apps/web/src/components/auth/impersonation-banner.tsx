"use client";

import { useState } from "react";

interface ImpersonationBannerProps {
  email: string | null;
}

export function ImpersonationBanner({ email }: ImpersonationBannerProps) {
  const [loading, setLoading] = useState(false);

  async function handleExit() {
    setLoading(true);
    const response = await fetch("/api/admin/impersonate", { method: "DELETE" });
    const body = (await response.json()) as { redirect?: string };
    window.location.href = body.redirect ?? "/admin";
  }

  return (
    <div className="sticky top-0 z-50 border-b border-forge-steel/30 bg-forge-steel/15 px-4 py-2.5 backdrop-blur">
      <div className="mx-auto flex max-w-lg flex-wrap items-center justify-between gap-2 sm:max-w-none">
        <p className="text-sm text-forge-text">
          <span className="font-semibold text-forge-steel">Read-only view</span>
          {" · "}
          Viewing as {email ?? "member"}
        </p>
        <button
          type="button"
          onClick={handleExit}
          disabled={loading}
          className="rounded-lg border border-forge-steel/40 px-3 py-1.5 text-xs font-semibold text-forge-text transition-colors hover:bg-forge-steel/10 disabled:opacity-50"
        >
          {loading ? "Exiting…" : "Exit to admin"}
        </button>
      </div>
    </div>
  );
}
