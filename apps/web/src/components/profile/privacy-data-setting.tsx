"use client";

import { deleteAccount } from "@/app/actions/account";
import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import type { AccountExportBundle } from "@/lib/account/export";
import { mergeExportWithLocalWorkouts } from "@/lib/account/export-enrich";
import { clearOfflineUserData, syncWorkoutData } from "@forgefit/offline-sync";
import { createClient } from "@/lib/supabase/client";
import { useState, useTransition } from "react";

interface PrivacyDataSettingProps {
  email: string;
  userId: string;
  canExport?: boolean;
}

export function PrivacyDataSetting({
  email,
  userId,
  canExport = true,
}: PrivacyDataSettingProps) {
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function downloadExport(format: "json" | "csv") {
    setExporting(true);
    setExportMessage(null);
    setError(null);

    try {
      await syncWorkoutData(userId);

      const query = format === "csv" ? "?format=csv" : "";
      const response = await fetch(`/api/account/export${query}`);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Could not export your data. Try again.");
        return;
      }

      const dateStamp = new Date().toISOString().slice(0, 10);

      if (format === "csv") {
        const csv = await response.text();
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `forgefit-export-${dateStamp}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const bundle = (await response.json()) as AccountExportBundle;
        const enriched = await mergeExportWithLocalWorkouts(bundle, userId);
        const blob = new Blob([JSON.stringify(enriched, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `forgefit-export-${dateStamp}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }

      setExportMessage(
        "Download started. Keep this file if you plan to delete your account."
      );
    } catch {
      setError("Could not export your data. Check your connection and try again.");
    } finally {
      setExporting(false);
    }
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(confirmationEmail);
      if (result.error) {
        setError(result.error);
        return;
      }

      try {
        await clearOfflineUserData(userId);
      } catch {
        // Account is already gone server-side; local cleanup is best-effort.
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login?deleted=1";
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5">
      <h2 className="font-display text-sm font-semibold text-forge-text">
        Privacy & data
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Download everything ForgeFit stores about you, or permanently delete
        your account and all associated data.
      </p>

      <div className="mt-4 space-y-3">
        {canExport ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void downloadExport("json")}
              disabled={exporting || pending}
              className="min-h-[48px] rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-forge-text transition-colors hover:border-forge-ember/40 disabled:opacity-60"
            >
              {exporting ? "Preparing…" : "Export JSON"}
            </button>
            <button
              type="button"
              onClick={() => void downloadExport("csv")}
              disabled={exporting || pending}
              className="min-h-[48px] rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-forge-text transition-colors hover:border-forge-ember/40 disabled:opacity-60"
            >
              {exporting ? "Preparing…" : "Export CSV"}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-3">
            <p className="text-sm font-medium text-forge-text">Export my data</p>
            <UpgradePrompt
              compact
              title=""
              description="Full JSON export is included with"
              suggestedTier="pro"
            />
          </div>
        )}

        {exportMessage && (
          <p className="text-sm text-forge-success">{exportMessage}</p>
        )}

        {!showDeleteForm ? (
          <button
            type="button"
            onClick={() => {
              setShowDeleteForm(true);
              setError(null);
            }}
            disabled={pending}
            className="min-h-[48px] w-full rounded-xl border border-forge-coral/30 px-4 py-3 text-sm font-semibold text-forge-coral transition-colors hover:border-forge-coral/60 disabled:opacity-60"
          >
            Delete my account
          </button>
        ) : (
          <div className="rounded-xl border border-forge-coral/30 bg-forge-coral/5 p-4">
            <p className="text-sm font-medium text-forge-text">
              This permanently deletes your account
            </p>
            <p className="mt-1 text-xs text-forge-muted">
              Your profile, programs, workouts, nutrition logs, measurements,
              and equipment settings will be removed from ForgeFit. This cannot
              be undone. Export your data first if you want a copy.
            </p>

            <label className="mt-4 block text-xs font-medium text-forge-muted">
              Type your email to confirm
              <input
                type="email"
                value={confirmationEmail}
                onChange={(event) => setConfirmationEmail(event.target.value)}
                placeholder={email}
                autoComplete="email"
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-forge-surface px-3 py-2 text-sm text-forge-text"
              />
            </label>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={pending || !confirmationEmail.trim()}
                onClick={handleDelete}
                className="min-h-[44px] flex-1 rounded-lg bg-forge-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {pending ? "Deleting…" : "Permanently delete account"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setShowDeleteForm(false);
                  setConfirmationEmail("");
                  setError(null);
                }}
                className="min-h-[44px] rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-forge-coral">{error}</p>}
      </div>
    </section>
  );
}
