"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BROADCAST_SEGMENTS,
  type BroadcastSegment,
} from "@/lib/admin/broadcast-segments";

export function AdminBroadcastForm() {
  const router = useRouter();
  const [segment, setSegment] = useState<BroadcastSegment>("all_users");
  const [channel, setChannel] = useState<"email" | "push" | "both">("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/home");
  const [reason, setReason] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      const response = await fetch(
        `/api/admin/broadcast?segment=${encodeURIComponent(segment)}`
      );
      const data = (await response.json()) as { count?: number };
      if (!cancelled && response.ok) {
        setPreviewCount(data.count ?? 0);
      }
    }

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [segment]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segment, channel, subject, body, url, reason }),
    });

    const result = (await response.json()) as {
      error?: string;
      emailSent?: number;
      pushSent?: number;
      attempted?: number;
      skipped?: number;
    };

    if (!response.ok) {
      setError(result.error ?? "Broadcast failed.");
      setLoading(false);
      return;
    }

    setMessage(
      `Sent to ${result.attempted ?? 0} recipient(s): ${result.emailSent ?? 0} email, ${result.pushSent ?? 0} push (${result.skipped ?? 0} skipped).`
    );
    router.refresh();
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-forge-surface-raised p-4 sm:p-5"
    >
      {message ? (
        <p className="mb-4 rounded-xl border border-forge-success/30 bg-forge-success/10 px-3 py-2 text-sm text-forge-success">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-xl border border-forge-coral/30 bg-forge-coral/10 px-3 py-2 text-sm text-forge-coral">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-forge-muted">
          Segment
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value as BroadcastSegment)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
          >
            {BROADCAST_SEGMENTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[11px]">
            {BROADCAST_SEGMENTS.find((item) => item.id === segment)?.description}
            {previewCount != null ? ` · ~${previewCount} recipients (max 500)` : null}
          </span>
        </label>

        <label className="text-xs font-medium text-forge-muted">
          Channel
          <select
            value={channel}
            onChange={(e) =>
              setChannel(e.target.value as "email" | "push" | "both")
            }
            className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
          >
            <option value="email">Email (Resend)</option>
            <option value="push">Push (web push subscriptions)</option>
            <option value="both">Email + push</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block text-xs font-medium text-forge-muted">
        Subject / push title
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
        />
      </label>

      <label className="mt-4 block text-xs font-medium text-forge-muted">
        Body
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={5}
          className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
        />
      </label>

      <label className="mt-4 block text-xs font-medium text-forge-muted">
        Deep link (push only)
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
        />
      </label>

      <label className="mt-4 block text-xs font-medium text-forge-muted">
        Reason (min 10 characters, audit log)
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          minLength={10}
          rows={2}
          className="mt-1 w-full rounded-xl border border-white/10 bg-forge-surface px-3 py-2 text-sm text-forge-text"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-forge-ember px-4 py-2.5 text-sm font-bold text-white hover:bg-forge-glow disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Sending…" : "Send broadcast"}
      </button>
    </form>
  );
}
