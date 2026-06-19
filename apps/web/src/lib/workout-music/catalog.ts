export type WorkoutMusicVibe = "focus" | "pump" | "cardio" | "cooldown";

export interface WorkoutMusicPlaylist {
  vibe: WorkoutMusicVibe;
  label: string;
  description: string;
  /** Replace with ForgeRep-owned playlists before public launch. */
  spotifyPlaylistId: string;
}

/**
 * Interim Spotify editorial playlists — swap IDs when ForgeRep brand playlists exist.
 * @see docs/spotify-integration-plan.md
 */
export const WORKOUT_MUSIC_PLAYLISTS: readonly WorkoutMusicPlaylist[] = [
  {
    vibe: "focus",
    label: "Focus",
    description: "Steady tempo for heavy sets and concentration",
    spotifyPlaylistId: "37i9dQZF1DWZeKCadgRd",
  },
  {
    vibe: "pump",
    label: "Pump",
    description: "High energy for strength and hypertrophy",
    spotifyPlaylistId: "37i9dQZF1DX76Wl510nF78",
  },
  {
    vibe: "cardio",
    label: "Cardio",
    description: "Upbeat tracks for intervals and conditioning",
    spotifyPlaylistId: "37i9dQZF1DXa2SPUUp9DKK",
  },
  {
    vibe: "cooldown",
    label: "Cooldown",
    description: "Wind down after your session",
    spotifyPlaylistId: "37i9dQZF1DX4sWSpwq3LiO",
  },
] as const;

export const WORKOUT_MUSIC_VIBES: readonly WorkoutMusicVibe[] =
  WORKOUT_MUSIC_PLAYLISTS.map((entry) => entry.vibe);

export function isWorkoutMusicVibe(value: string): value is WorkoutMusicVibe {
  return (WORKOUT_MUSIC_VIBES as readonly string[]).includes(value);
}

export function getWorkoutMusicPlaylist(
  vibe: WorkoutMusicVibe
): WorkoutMusicPlaylist | undefined {
  return WORKOUT_MUSIC_PLAYLISTS.find((entry) => entry.vibe === vibe);
}

export function spotifyPlaylistUrl(playlistId: string): string {
  return `https://open.spotify.com/playlist/${playlistId}`;
}

export function spotifyPlaylistDeepLink(playlistId: string): string {
  return `spotify:playlist:${playlistId}`;
}
