export type WorkoutMusicVibe = "focus" | "pump" | "cardio" | "cooldown";

export interface WorkoutMusicPlaylist {
  vibe: WorkoutMusicVibe;
  label: string;
  description: string;
  /** ForgeRep curated playlist on Spotify. */
  spotifyPlaylistId: string;
}

/** ForgeRep curated workout playlists on Spotify. */
export const WORKOUT_MUSIC_PLAYLISTS: readonly WorkoutMusicPlaylist[] = [
  {
    vibe: "focus",
    label: "Focus",
    description: "Instrumental beats for heavy sets and concentration",
    spotifyPlaylistId: "5gW25jhAHgV9o6bPlohwkW",
  },
  {
    vibe: "pump",
    label: "Pump",
    description: "High energy for strength and hypertrophy",
    spotifyPlaylistId: "6Z6ItLq9dyeOAQoQMOSHSS",
  },
  {
    vibe: "cardio",
    label: "Cardio",
    description: "Upbeat tracks for intervals and conditioning",
    spotifyPlaylistId: "08QQItS1zdpZOpb9orHKIw",
  },
  {
    vibe: "cooldown",
    label: "Cooldown",
    description: "Wind down after your session",
    spotifyPlaylistId: "30Cy6UK0S0yHj30uawbbQG",
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
