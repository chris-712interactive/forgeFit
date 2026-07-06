"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminOperatorRow } from "@/lib/admin/admins";

interface AdminOperatorsPanelProps {
  admins: AdminOperatorRow[];
}

export function AdminOperatorsPanel({ admins }: AdminOperatorsPanelProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [lookupResult, setLookupResult] = useState<AdminOperatorRow | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLookupResult(null);

    const response = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lookup", email }),
    });

    const body = (await response.json()) as {
      error?: string;
      user?: AdminOperatorRow;
    };

    if (!response.ok) {
      setError(body.error ?? "Lookup failed.");
      setLoading(false);
      return;
    }

    setLookupResult(body.user ?? null);
    setLoading(false);
  }

  async function toggleAdmin(target: AdminOperatorRow, grant: boolean) {
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: grant ? "grant" : "revoke",
        targetUserId: target.id,
        reason,
      }),
    });

    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Update failed.");
      setLoading(false);
      return;
    }

    setMessage(grant ? "Admin access granted." : "Admin access revoked.");
    setLookupResult(null);
    setEmail("");
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-xl border border-forge-success/30 bg-forge-success/10 px-3 py-2 text-sm text-forge-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-forge-coral/30 bg-forge-coral/10 px-3 py-2 text-sm text-forge-coral">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold text-forge-text">
          Current admins
        </h2>
        <ul className="mt-4 space-y-2">
          {admins.length === 0 ? (
            <li className="text-sm text-forge-muted">No admins flagged in DB.</li>
          ) : (
            admins.map((admin) => (
              <li
                key={admin.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-forge-surface px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-forge-text">
                    {admin.email ?? "No email"}
                  </p>
                  <p className="text-xs text-forge-muted">
                    {admin.displayName ?? "—"} ·{" "}
                    <Link
                      href={`/admin/users/${admin.id}`}
                      className="text-forge-steel hover:underline"
                    >
                      View user
                    </Link>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loading || !reason.trim() || reason.trim().length < 10}
                  onClick={() => toggleAdmin(admin, false)}
                  className="rounded-lg border border-forge-coral/30 px-3 py-1.5 text-xs font-semibold text-forge-coral hover:bg-forge-coral/10 disabled:opacity-50"
                >
                  Revoke
                </button>
              </li>
            ))
          )}
        </ul>
        <p className="mt-3 text-xs text-forge-muted">
          Users in <code className="text-forge-text">ADMIN_USER_IDS</code> env
          also have access even if <code className="text-forge-text">is_admin</code>{" "}
          is false.
        </p>
      </section>

      <form
        onSubmit={handleLookup}
        className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5"
      >
        <h2 className="font-display text-lg font-bold text-forge-text">
          Grant admin access
        </h2>
        <p className="mt-1 text-xs text-forge-muted">
          Sets <code className="text-forge-text">profiles.is_admin = true</code>.
          Requires audit reason below.
        </p>

        <label className="mt-4 block text-xs font-medium text-forge-muted">
          User email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-3 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-forge-text hover:bg-white/5 disabled:opacity-60"
        >
          Look up user
        </button>

        {lookupResult ? (
          <div className="mt-4 rounded-xl border border-forge-steel/20 bg-forge-steel/5 p-3">
            <p className="text-sm font-medium text-forge-text">
              {lookupResult.email} · {lookupResult.isAdmin ? "Already admin" : "Not admin"}
            </p>
            {!lookupResult.isAdmin ? (
              <button
                type="button"
                disabled={loading || reason.trim().length < 10}
                onClick={() => toggleAdmin(lookupResult, true)}
                className="mt-3 rounded-xl bg-forge-ember px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                Grant admin
              </button>
            ) : null}
          </div>
        ) : null}

        <label className="mt-4 block text-xs font-medium text-forge-muted">
          Reason for grant/revoke (min 10 characters)
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={10}
            rows={2}
            className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
          />
        </label>
      </form>
    </div>
  );
}
