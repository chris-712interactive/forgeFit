"use client";

import {
  WORKOUT_MUSIC_PLAYLISTS,
  type WorkoutMusicVibe,
} from "@/lib/workout-music/catalog";
import type { SpotifyPublicStatus } from "@/lib/integrations/spotify-service";
import { SpotifyAttribution } from "@/components/workout/spotify-attribution";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface WorkoutMusicSettingProps {
  initialStatus: SpotifyPublicStatus;
  spotifyStatus?: string | null;
  spotifyError?: string | null;
}

function formatSpotifyError(reason: string): string {
  if (reason === "premium_required") {
    return "In-app controls need Spotify Premium. You can still open playlists from the workout vibe picker.";
  }
  if (reason === "no_active_device") {
    return "Open Spotify on this device, then try again.";
  }
  return reason;
}

export function WorkoutMusicSetting({
  initialStatus,
  spotifyStatus,
  spotifyError,
}: WorkoutMusicSettingProps) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [status, setStatus] = useState(initialStatus);
  const [autoStart, setAutoStart] = useState(initialStatus.autoStart);
  const [defaultVibe, setDefaultVibe] = useState<WorkoutMusicVibe | null>(
    initialStatus.defaultVibe
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(spotifyError ?? null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (spotifyStatus === "connected") {
      setMessage("Spotify connected.");
      void refreshStatus();
      router.replace("/profile#workout-music", { scroll: false });
    }
  }, [spotifyStatus, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("spotify_error");
    if (urlError) {
      setError(urlError);
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  async function refreshStatus() {
    const response = await fetch("/api/integrations/spotify/status");
    if (!response.ok) return;
    const body = (await response.json()) as SpotifyPublicStatus;
    setStatus(body);
    setAutoStart(body.autoStart);
    setDefaultVibe(body.defaultVibe);
  }

  async function savePrefs(patch: {
    autoStart?: boolean;
    defaultVibe?: WorkoutMusicVibe | null;
  }) {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/spotify/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(body.error ?? "Could not save workout music settings.");
        return;
      }

      if (patch.autoStart != null) setAutoStart(patch.autoStart);
      if (patch.defaultVibe !== undefined) setDefaultVibe(patch.defaultVibe);
      setMessage("Workout music settings saved.");
      await refreshStatus();
    } catch {
      setError("Could not save workout music settings.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/spotify/disconnect", {
        method: "POST",
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(body.error ?? "Could not disconnect Spotify.");
        return;
      }

      setMessage("Spotify disconnected.");
      await refreshStatus();
    } catch {
      setError("Could not disconnect Spotify.");
    } finally {
      setBusy(false);
    }
  }

  const connectHref =
    status.configured && !status.connected
      ? "/api/integrations/spotify/connect"
      : null;

  return (
    <section
      ref={sectionRef}
      id="workout-music"
      className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5"
    >
      <h2 className="font-display text-sm font-semibold text-forge-text">
        Workout music
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Connect Spotify for in-workout play/pause/skip controls. Vibe deep links
        on the Workout tab work without connecting.
      </p>
      <SpotifyAttribution className="mt-2" />

      {error && (
        <p className="mt-3 text-sm text-forge-coral" role="alert">
          {formatSpotifyError(error)}
        </p>
      )}

      {message && !error && (
        <p className="mt-3 text-sm text-emerald-300">{message}</p>
      )}

      {!status.configured && (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
          Spotify is not configured in this environment yet.
        </p>
      )}

      {status.configured && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                status.connected
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-forge-surface text-forge-muted"
              }`}
            >
              {status.connected ? "Connected" : "Not connected"}
            </span>

            <div className="flex flex-wrap gap-2">
              {status.connected ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDisconnect()}
                  className="min-h-[40px] rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-forge-text disabled:opacity-60"
                >
                  Disconnect
                </button>
              ) : connectHref ? (
                <a
                  href={connectHref}
                  className="inline-flex min-h-[40px] items-center rounded-lg bg-forge-ember px-3 py-2 text-xs font-semibold text-white hover:bg-forge-glow"
                >
                  Connect Spotify
                </a>
              ) : null}
            </div>
          </div>

          {status.connected && status.lastError && (
            <p className="text-xs text-amber-200">{status.lastError}</p>
          )}

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-forge-muted">
              Default vibe
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {WORKOUT_MUSIC_PLAYLISTS.map((playlist) => (
                <button
                  key={playlist.vibe}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void savePrefs({ defaultVibe: playlist.vibe })
                  }
                  className={`min-h-[40px] rounded-xl border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                    defaultVibe === playlist.vibe
                      ? "border-forge-ember bg-forge-ember/15 text-forge-ember"
                      : "border-[var(--border)] bg-forge-surface text-forge-muted hover:border-forge-ember/40"
                  }`}
                >
                  {playlist.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-forge-surface p-3">
            <input
              type="checkbox"
              checked={autoStart}
              disabled={busy || !status.connected}
              onChange={(event) =>
                void savePrefs({ autoStart: event.target.checked })
              }
              className="mt-1 h-4 w-4 rounded border-[var(--border)] accent-forge-ember"
            />
            <span className="text-sm text-forge-text">
              Auto-start my default vibe when a workout begins
              <span className="mt-1 block text-xs text-forge-muted">
                Requires Spotify Premium and the Spotify app active on this
                device. Never blocks workout logging if playback fails.
              </span>
            </span>
          </label>

          <p className="text-[11px] text-forge-muted">
            By connecting, you authorize ForgeRep to control Spotify playback on
            your account.{" "}
            <Link
              href="/privacy#integrations"
              className="font-medium text-forge-steel hover:underline"
            >
              Privacy details
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
