"use client";

import type { SpotifyPlaybackView } from "@/lib/integrations/spotify-service";
import {
  openWorkoutPlaylistInSpotify,
  requestSpotifyPlaybackAction,
  wakeSpotifyAndStartPlayback,
} from "@/lib/workout-music/spotify-wake-playback";
import { useCallback, useEffect, useState } from "react";

interface WorkoutMusicTransportProps {
  enabled: boolean;
  offline?: boolean;
}

function formatPlaybackError(reason: string, waking = false): string {
  switch (reason) {
    case "premium_required":
      return "Spotify Premium required for in-app controls.";
    case "no_active_device":
      return waking
        ? "Opening Spotify… starting your playlist shortly."
        : "Tap Play in Spotify, then return here and press ▶ again.";
    case "not_connected":
      return "Connect Spotify in Profile → Workout music.";
    default:
      return reason;
  }
}

export function WorkoutMusicTransport({
  enabled,
  offline = false,
}: WorkoutMusicTransportProps) {
  const [playback, setPlayback] = useState<SpotifyPlaybackView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wakingSpotify, setWakingSpotify] = useState(false);

  const refreshPlayback = useCallback(async () => {
    if (!enabled || offline) return;

    try {
      const response = await fetch("/api/integrations/spotify/playback");
      if (!response.ok) return;
      const body = (await response.json()) as SpotifyPlaybackView;
      setPlayback(body);
      if (body.message && body.premiumRequired) {
        setError(body.message);
      } else if (!wakingSpotify) {
        setError(null);
      }
    } catch {
      // Non-blocking — transport is optional.
    }
  }, [enabled, offline, wakingSpotify]);

  useEffect(() => {
    void refreshPlayback();
    if (!enabled || offline) return;

    const interval = window.setInterval(() => {
      void refreshPlayback();
    }, 8000);

    return () => window.clearInterval(interval);
  }, [enabled, offline, refreshPlayback]);

  async function attemptPlay(): Promise<{ ok: true } | { ok: false; error: string }> {
    const apiAction = playback?.trackName ? "resume" : "start";
    const initial = await requestSpotifyPlaybackAction(apiAction);
    if (initial.ok) return initial;
    if (initial.error !== "no_active_device") return initial;

    setWakingSpotify(true);
    setError(formatPlaybackError("no_active_device", true));

    const wakeResult = await wakeSpotifyAndStartPlayback();
    setWakingSpotify(false);

    return wakeResult;
  }

  async function sendAction(action: "pause" | "resume" | "next" | "previous") {
    if (offline || busy) return;
    setBusy(true);
    setError(null);

    const previousPlaying = playback?.isPlaying ?? false;

    if (action === "pause" || action === "resume") {
      setPlayback((current) =>
        current
          ? {
              ...current,
              isPlaying: action === "resume",
            }
          : current
      );
    }

    try {
      let result:
        | { ok: true }
        | { ok: false; error: string };

      if (action === "resume") {
        result = await attemptPlay();
      } else {
        result = await requestSpotifyPlaybackAction(action);
      }

      if (!result.ok) {
        setPlayback((current) =>
          current ? { ...current, isPlaying: previousPlaying } : current
        );
        setError(formatPlaybackError(result.error));
        return;
      }

      setError(null);
      await refreshPlayback();
    } catch {
      setPlayback((current) =>
        current ? { ...current, isPlaying: previousPlaying } : current
      );
      setError("Playback control failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!enabled || offline || !playback?.connected || !playback.configured) {
    return null;
  }

  if (playback.premiumRequired) {
    return (
      <div className="mb-4 rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 py-2.5">
        <p className="text-xs text-forge-muted">{playback.message}</p>
      </div>
    );
  }

  const trackLine =
    playback.trackName && playback.artistName
      ? `${playback.trackName} · ${playback.artistName}`
      : playback.trackName ?? "Nothing playing";

  const showWakeHint = !playback.trackName && !playback.isPlaying;

  return (
    <div className="mb-4 rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-forge-muted">
            Spotify
          </p>
          <p className="mt-0.5 truncate text-sm font-medium text-forge-text">
            {trackLine}
          </p>
          {showWakeHint && !error && (
            <p className="mt-1 text-xs text-forge-muted">
              Press ▶ to open Spotify and start your workout playlist.
            </p>
          )}
          {error && (
            <p className="mt-1 text-xs text-forge-gold">{error}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <TransportButton
            label="Previous track"
            disabled={busy || wakingSpotify}
            onClick={() => void sendAction("previous")}
          >
            ⏮
          </TransportButton>
          <TransportButton
            label={playback.isPlaying ? "Pause" : "Play"}
            disabled={busy || wakingSpotify}
            prominent
            onClick={() =>
              void sendAction(playback.isPlaying ? "pause" : "resume")
            }
          >
            {playback.isPlaying ? "⏸" : "▶"}
          </TransportButton>
          <TransportButton
            label="Next track"
            disabled={busy || wakingSpotify}
            onClick={() => void sendAction("next")}
          >
            ⏭
          </TransportButton>
        </div>
      </div>

      <button
        type="button"
        onClick={() => openWorkoutPlaylistInSpotify()}
        className="mt-2.5 min-h-11 rounded-lg px-1 text-xs font-medium text-forge-steel hover:underline"
      >
        Open playlist in Spotify
      </button>
    </div>
  );
}

function TransportButton({
  label,
  disabled,
  prominent = false,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  prominent?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-12 min-w-12 items-center justify-center rounded-xl border text-base text-forge-text transition-colors hover:border-forge-ember/40 active:scale-95 disabled:opacity-60 ${
        prominent
          ? "h-12 w-12 border-forge-ember/30 bg-forge-surface text-lg"
          : "h-11 w-11 border-[var(--border)] bg-forge-surface/80"
      }`}
    >
      {children}
    </button>
  );
}
