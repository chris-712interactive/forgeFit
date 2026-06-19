"use client";

import type { SpotifyPlaybackView } from "@/lib/integrations/spotify-service";
import {
  getSavedWorkoutMusicPlaylist,
  getSavedWorkoutMusicVibe,
} from "@/lib/workout-music/preferences";
import {
  getWorkoutMusicPlaylist,
} from "@/lib/workout-music/catalog";
import { openSpotifyPlaylist } from "@/lib/workout-music/open-spotify";
import { useCallback, useEffect, useState } from "react";

interface WorkoutMusicTransportProps {
  enabled: boolean;
  offline?: boolean;
}

function formatPlaybackError(reason: string): string {
  switch (reason) {
    case "premium_required":
      return "Spotify Premium required for in-app controls.";
    case "no_active_device":
      return "Open Spotify on this phone, play any song once, then try again.";
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

  const refreshPlayback = useCallback(async () => {
    if (!enabled || offline) return;

    try {
      const response = await fetch("/api/integrations/spotify/playback");
      if (!response.ok) return;
      const body = (await response.json()) as SpotifyPlaybackView;
      setPlayback(body);
      if (body.message && body.premiumRequired) {
        setError(body.message);
      } else if (body.noActiveDevice) {
        setError(formatPlaybackError("no_active_device"));
      } else {
        setError(null);
      }
    } catch {
      // Non-blocking — transport is optional.
    }
  }, [enabled, offline]);

  useEffect(() => {
    void refreshPlayback();
    if (!enabled || offline) return;

    const interval = window.setInterval(() => {
      void refreshPlayback();
    }, 8000);

    return () => window.clearInterval(interval);
  }, [enabled, offline, refreshPlayback]);

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
      const response = await fetch("/api/integrations/spotify/playback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setPlayback((current) =>
          current ? { ...current, isPlaying: previousPlaying } : current
        );
        setError(formatPlaybackError(body.error ?? "Playback control failed."));
        return;
      }

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

  function openSavedPlaylist() {
    const saved = getSavedWorkoutMusicPlaylist();
    if (saved) {
      openSpotifyPlaylist(saved.spotifyPlaylistId);
      return;
    }

    const vibe = getSavedWorkoutMusicVibe();
    if (vibe) {
      const playlist = getWorkoutMusicPlaylist(vibe);
      if (playlist) openSpotifyPlaylist(playlist.spotifyPlaylistId);
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

  return (
    <div className="mb-4 rounded-xl border border-[var(--border)] bg-forge-surface-raised px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-forge-muted">
            Spotify
          </p>
          <p className="mt-0.5 truncate text-sm font-medium text-forge-text">
            {trackLine}
          </p>
          {error && (
            <p className="mt-1 text-xs text-forge-gold">{error}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <TransportButton
            label="Previous track"
            disabled={busy}
            onClick={() => void sendAction("previous")}
          >
            ⏮
          </TransportButton>
          <TransportButton
            label={playback.isPlaying ? "Pause" : "Play"}
            disabled={busy}
            prominent
            onClick={() =>
              void sendAction(playback.isPlaying ? "pause" : "resume")
            }
          >
            {playback.isPlaying ? "⏸" : "▶"}
          </TransportButton>
          <TransportButton
            label="Next track"
            disabled={busy}
            onClick={() => void sendAction("next")}
          >
            ⏭
          </TransportButton>
        </div>
      </div>

      <button
        type="button"
        onClick={openSavedPlaylist}
        className="mt-2 text-xs font-medium text-forge-steel hover:underline"
      >
        Open in Spotify
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
