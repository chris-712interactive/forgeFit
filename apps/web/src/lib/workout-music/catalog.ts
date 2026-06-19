export type WorkoutMusicVibe = "focus" | "pump" | "cardio" | "cooldown";

export interface WorkoutMusicPlaylist {
  vibe: WorkoutMusicVibe;
  label: string;
  description: string;
  /** Replace with ForgeRep-owned playlists before public launch. */
  spotifyPlaylistId: string;
}

/**
 * Verified public Spotify playlists — swap for ForgeRep-owned playlists before launch.
 * Editorial playlists (37i9dQZF1…) are often unavailable outside the Spotify app.
 * @see docs/spotify-integration-plan.md
 */
export const WORKOUT_MUSIC_PLAYLISTS: readonly WorkoutMusicPlaylist[] = [
  {
    vibe: "focus",
    label: "Focus",
    description: "Instrumental beats for heavy sets and concentration",
    spotifyPlaylistId: "4jSmTgJDyORqXulIacZhhu",
  },
  {
    vibe: "pump",
    label: "Pump",
    description: "High energy for strength and hypertrophy",
    spotifyPlaylistId: "57GAUprXFP9XIZaupQzIsS",
  },
  {
    vibe: "cardio",
    label: "Cardio",
    description: "Upbeat tracks for intervals and conditioning",
    spotifyPlaylistId: "07QTzPiEFAthtiAeqNmzfS",
  },
  {
    vibe: "cooldown",
    label: "Cooldown",
    description: "Wind down after your session",
    spotifyPlaylistId: "1buPbOqsVbtpHcnp3AyqvQ",
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
