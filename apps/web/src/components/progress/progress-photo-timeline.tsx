"use client";

import type { ProgressPhotoRow } from "@/lib/progress-photos/types";
import { FEATURE_TEMPORARILY_UNAVAILABLE } from "@/lib/ui/member-errors";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProgressPhotoTimelineProps {
  initialPhotos: ProgressPhotoRow[];
  tableReady: boolean;
}

export function ProgressPhotoTimeline({
  initialPhotos,
  tableReady,
}: ProgressPhotoTimelineProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [takenDate, setTakenDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [caption, setCaption] = useState("");

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("takenDate", takenDate);
      if (caption.trim()) form.append("caption", caption.trim());

      const response = await fetch("/api/progress-photos", {
        method: "POST",
        body: form,
      });

      const body = (await response.json()) as {
        photo?: ProgressPhotoRow;
        error?: string;
      };

      if (!response.ok || !body.photo) {
        setError(body.error ?? "Upload failed.");
        return;
      }

      setPhotos((current) => [body.photo!, ...current]);
      setCaption("");
      router.refresh();
    } catch {
      setError("Upload failed. Check your connection.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/progress-photos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Could not delete photo.");
        return;
      }

      setPhotos((current) => current.filter((photo) => photo.id !== id));
      router.refresh();
    } catch {
      setError("Could not delete photo.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!tableReady) {
    return (
      <p className="text-sm text-forge-muted">
        {FEATURE_TEMPORARILY_UNAVAILABLE}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block text-sm">
          <span className="text-forge-muted">Photo date</span>
          <input
            type="date"
            value={takenDate}
            onChange={(event) => setTakenDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-forge-surface px-3 py-2 text-forge-text"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-forge-muted">Caption (optional)</span>
          <input
            type="text"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={200}
            placeholder="e.g. Week 8 check-in"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-forge-surface px-3 py-2 text-forge-text"
          />
        </label>
      </div>

      <label className="flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-forge-ember/40 bg-forge-ember/5 px-4 py-3 text-sm font-semibold text-forge-ember transition-colors hover:bg-forge-ember/10">
        {uploading ? "Uploading…" : "Add progress photo"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleUpload(file);
            event.target.value = "";
          }}
        />
      </label>

      {error && <p className="text-sm text-forge-coral">{error}</p>}

      {photos.length === 0 ? (
        <p className="text-sm text-forge-muted">
          Private timeline — photos stay on your account and sync to your log
          dates.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="overflow-hidden rounded-2xl border border-[var(--border)] bg-forge-surface"
            >
              {photo.signedUrl ? (
                <div className="relative aspect-[3/4] w-full bg-forge-surface-raised">
                  <Image
                    src={photo.signedUrl}
                    alt={photo.caption ?? "Progress photo"}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="flex aspect-[3/4] items-center justify-center text-sm text-forge-muted">
                  Preview unavailable
                </div>
              )}
              <div className="flex items-start justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-medium text-forge-text">
                    {photo.takenDate}
                  </p>
                  {photo.caption && (
                    <p className="mt-1 text-xs text-forge-muted">
                      {photo.caption}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={deletingId === photo.id}
                  onClick={() => void handleDelete(photo.id)}
                  className="text-xs font-medium text-forge-coral disabled:opacity-50"
                >
                  {deletingId === photo.id ? "…" : "Remove"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
