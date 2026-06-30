"use client";

import { pushMfpImportCompletedEvent } from "@/lib/analytics/events";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function MfpImportPanel() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/nutrition/import", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as {
        error?: string;
        imported?: number;
        skipped?: number;
        warnings?: string[];
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Import failed.");
      }

      const imported = body.imported ?? 0;
      pushMfpImportCompletedEvent(imported);
      setMessage(
        `Imported ${imported} entr${imported === 1 ? "y" : "ies"}${
          body.skipped ? ` · skipped ${body.skipped} outside the last 90 days` : ""
        }.`
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Import from MyFitnessPal
      </h2>
      <p className="mt-1 text-sm text-forge-muted">
        Export your diary CSV from MyFitnessPal (Reports → Export) and upload it
        here. We import the last 90 days into your ForgeRep diary.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(event) => void handleFileChange(event)}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl border border-forge-steel/40 font-display text-sm font-semibold text-forge-steel transition-colors hover:border-forge-ember/40 hover:text-forge-ember disabled:opacity-50"
      >
        {uploading ? "Importing…" : "Choose CSV file"}
      </button>

      {message && (
        <p className="mt-3 text-sm text-forge-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-forge-coral" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
