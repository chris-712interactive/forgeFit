"use client";

import type { SpotifyPlaybackView } from "@/lib/integrations/spotify-service";
import { readActionError } from "@/lib/auth/action-result";
import {
  getWorkoutMusicPlaylist,
} from "@/lib/workout-music/catalog";
import {
  getSavedWorkoutMusicVibe,
} from "@/lib/workout-music/preferences";
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
        : "Tap Play in Spotify once, then press play here again.";
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
      let result: { ok: true } | { ok: false; error: string };

      if (action === "resume") {
        result = await attemptPlay();
      } else {
        result = await requestSpotifyPlaybackAction(action);
      }

      if (!result.ok) {
        setPlayback((current) =>
          current ? { ...current, isPlaying: previousPlaying } : current
        );
        setError(formatPlaybackError(readActionError(result) ?? "Playback failed."));
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
      <div className="mb-4 rounded-2xl border border-[var(--border)] bg-forge-surface-raised px-4 py-3">
        <p className="text-sm text-forge-muted">{playback.message}</p>
      </div>
    );
  }

  const savedVibe = getSavedWorkoutMusicVibe();
  const playlistLabel = savedVibe
    ? getWorkoutMusicPlaylist(savedVibe)?.label
    : null;

  const hasTrack = Boolean(playback.trackName);
  const showWakeHint = !hasTrack && !playback.isPlaying;

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-forge-surface-raised">
      <div className="border-b border-[var(--border)] px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <SpotifyMark />
            <p className="truncate text-xs font-medium text-forge-muted">
              {playlistLabel ? `${playlistLabel} playlist` : "Workout music"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openWorkoutPlaylistInSpotify()}
            className="shrink-0 text-xs font-medium text-forge-steel hover:underline"
          >
            Open app
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="min-h-[3.25rem]">
          {hasTrack ? (
            <>
              <p className="line-clamp-2 text-base font-semibold leading-snug text-forge-text">
                {playback.trackName}
              </p>
              {playback.artistName && (
                <p className="mt-1 line-clamp-1 text-sm text-forge-muted">
                  {playback.artistName}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-forge-text">
                Ready to play
              </p>
              <p className="mt-1 text-sm text-forge-muted">
                {playlistLabel
                  ? `Start your ${playlistLabel.toLowerCase()} playlist`
                  : "Press play to start music"}
              </p>
            </>
          )}
        </div>

        {showWakeHint && !error && (
          <p className="mt-2 text-xs text-forge-muted">
            Play opens Spotify on your phone if needed.
          </p>
        )}
        {error && (
          <p className="mt-2 text-xs leading-relaxed text-forge-gold">{error}</p>
        )}

        <div
          className="mt-5 flex items-center justify-center gap-5"
          role="group"
          aria-label="Spotify playback controls"
        >
          <SkipButton
            label="Previous track"
            disabled={busy || wakingSpotify}
            onClick={() => void sendAction("previous")}
          />
          <PlayPauseButton
            isPlaying={playback.isPlaying}
            disabled={busy || wakingSpotify}
            onClick={() =>
              void sendAction(playback.isPlaying ? "pause" : "resume")
            }
          />
          <SkipButton
            label="Next track"
            disabled={busy || wakingSpotify}
            forward
            onClick={() => void sendAction("next")}
          />
        </div>
      </div>
    </div>
  );
}

function SpotifyMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={16}
      height={16}
      aria-hidden
      className="shrink-0"
    >
      <path
        fill="#1DB954"
        d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
      />
    </svg>
  );
}

function SkipButton({
  label,
  disabled,
  forward = false,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  forward?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-forge-surface text-forge-text transition-all hover:border-forge-steel/40 hover:bg-forge-surface-raised active:scale-95 disabled:opacity-50"
    >
      <SkipIcon forward={forward} />
    </button>
  );
}

function PlayPauseButton({
  isPlaying,
  disabled,
  onClick,
}: {
  isPlaying: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={isPlaying ? "Pause" : "Play"}
      disabled={disabled}
      onClick={onClick}
      className="flex h-16 w-16 items-center justify-center rounded-full bg-forge-ember text-forge-surface shadow-[0_0_24px_rgba(255,107,53,0.35)] transition-all hover:bg-forge-glow active:scale-95 disabled:opacity-50"
    >
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
}

function SkipIcon({ forward = false }: { forward?: boolean }) {
  if (forward) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={22}
        height={22}
        fill="currentColor"
        aria-hidden
      >
        <path d="M16 18h2V6h-2v12zM6 18l9-6-9-6v12z" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="currentColor"
      aria-hidden
    >
      <path d="M6 6h2v12H6V6zm4.5 6L18 18V6l-7.5 6z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={28}
      height={28}
      fill="currentColor"
      aria-hidden
      className="ml-1"
    >
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={26}
      height={26}
      fill="currentColor"
      aria-hidden
    >
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  );
}
