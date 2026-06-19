"use client";

import {
  WORKOUT_MUSIC_PLAYLISTS,
  getWorkoutMusicPlaylist,
  type WorkoutMusicVibe,
} from "@/lib/workout-music/catalog";
import { openSpotifyPlaylist } from "@/lib/workout-music/open-spotify";
import {
  getSavedWorkoutMusicVibe,
  saveWorkoutMusicVibe,
} from "@/lib/workout-music/preferences";
import { SpotifyAttribution } from "./spotify-attribution";
import { useEffect, useState } from "react";

interface WorkoutMusicPickerProps {
  variant?: "full" | "compact";
  className?: string;
  offline?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function WorkoutMusicPicker({
  variant = "full",
  className = "",
  offline = false,
  dismissible = false,
  onDismiss,
}: WorkoutMusicPickerProps) {
  const [selectedVibe, setSelectedVibe] = useState<WorkoutMusicVibe | null>(
    null
  );

  useEffect(() => {
    setSelectedVibe(getSavedWorkoutMusicVibe());
  }, []);

  function handleSelect(vibe: WorkoutMusicVibe) {
    saveWorkoutMusicVibe(vibe);
    setSelectedVibe(vibe);

    if (offline) return;

    const playlist = getWorkoutMusicPlaylist(vibe);
    if (playlist) {
      openSpotifyPlaylist(playlist.spotifyPlaylistId);
    }
  }

  function handleReopenSaved() {
    if (offline || !selectedVibe) return;

    const playlist = getWorkoutMusicPlaylist(selectedVibe);
    if (playlist) {
      openSpotifyPlaylist(playlist.spotifyPlaylistId);
    }
  }

  if (variant === "compact") {
    const saved = selectedVibe
      ? getWorkoutMusicPlaylist(selectedVibe)
      : null;

    return (
      <div
        className={`rounded-2xl border border-[var(--border)] bg-forge-surface-raised px-4 py-3 ${className}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-forge-muted">
              Workout music
            </p>
            {saved ? (
              <button
                type="button"
                disabled={offline}
                onClick={handleReopenSaved}
                className="mt-1 w-full text-left disabled:opacity-60"
              >
                <p className="text-sm font-semibold text-forge-text">
                  {saved.label} playlist
                </p>
                <p className="mt-0.5 text-xs text-forge-steel">
                  Tap to open in Spotify
                </p>
              </button>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {WORKOUT_MUSIC_PLAYLISTS.map((playlist) => (
                  <VibeChip
                    key={playlist.vibe}
                    label={playlist.label}
                    selected={selectedVibe === playlist.vibe}
                    disabled={offline}
                    onClick={() => handleSelect(playlist.vibe)}
                  />
                ))}
              </div>
            )}
          </div>

          {dismissible && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-forge-muted transition-colors hover:bg-forge-surface hover:text-forge-text"
              aria-label="Dismiss workout music"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-forge-muted">
          Workout music
        </p>
        <SpotifyAttribution />
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {WORKOUT_MUSIC_PLAYLISTS.map((playlist) => (
          <VibeChip
            key={playlist.vibe}
            label={playlist.label}
            selected={selectedVibe === playlist.vibe}
            disabled={offline}
            onClick={() => handleSelect(playlist.vibe)}
          />
        ))}
      </div>

      {offline && (
        <p className="mt-2 text-[11px] text-forge-steel">
          Your vibe is saved locally. Connect to open Spotify.
        </p>
      )}

      {!offline && (
        <p className="mt-2 text-[11px] text-forge-muted">
          Tap a vibe to open in Spotify.
        </p>
      )}
    </div>
  );
}

function VibeChip({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-[40px] rounded-xl border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? "border-forge-ember bg-forge-ember/15 text-forge-ember"
          : "border-[var(--border)] bg-forge-surface text-forge-muted hover:border-forge-ember/40 hover:text-forge-text"
      }`}
    >
      {label}
    </button>
  );
}
