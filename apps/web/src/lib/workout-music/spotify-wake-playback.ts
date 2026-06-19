import { getWorkoutMusicPlaylist } from "./catalog";
import { openSpotifyPlaylist } from "./open-spotify";
import {
  getSavedWorkoutMusicPlaylist,
  getSavedWorkoutMusicVibe,
} from "./preferences";

export type SpotifyPlaybackAction =
  | "start"
  | "resume"
  | "pause"
  | "next"
  | "previous";

export function resolveWorkoutPlaylistId(): string | null {
  const saved = getSavedWorkoutMusicPlaylist();
  if (saved?.spotifyPlaylistId) {
    return saved.spotifyPlaylistId;
  }

  const vibe = getSavedWorkoutMusicVibe();
  if (vibe) {
    return getWorkoutMusicPlaylist(vibe)?.spotifyPlaylistId ?? null;
  }

  return getWorkoutMusicPlaylist("pump")?.spotifyPlaylistId ?? null;
}

export function openWorkoutPlaylistInSpotify(): boolean {
  const playlistId = resolveWorkoutPlaylistId();
  if (!playlistId) return false;
  openSpotifyPlaylist(playlistId);
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function requestSpotifyPlaybackAction(
  action: SpotifyPlaybackAction
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch("/api/integrations/spotify/playback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const body = (await response.json()) as { error?: string };

  if (!response.ok) {
    return { ok: false, error: body.error ?? "Playback control failed." };
  }

  return { ok: true };
}

/**
 * Spotify Connect only lists devices after the app is awake. Open the workout
 * playlist in Spotify, then retry API start until the phone registers.
 */
export async function wakeSpotifyAndStartPlayback(options?: {
  openSpotify?: boolean;
  initialDelayMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const {
    openSpotify = true,
    initialDelayMs = 1500,
    retryCount = 6,
    retryDelayMs = 2000,
  } = options ?? {};

  if (openSpotify) {
    openWorkoutPlaylistInSpotify();
    await sleep(initialDelayMs);
  }

  for (let attempt = 0; attempt < retryCount; attempt++) {
    const result = await requestSpotifyPlaybackAction("start");
    if (result.ok) return result;
    if (result.error !== "no_active_device") return result;
    if (attempt < retryCount - 1) {
      await sleep(retryDelayMs);
    }
  }

  return { ok: false, error: "no_active_device" };
}
