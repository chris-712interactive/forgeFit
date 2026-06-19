import {
  spotifyPlaylistDeepLink,
  spotifyPlaylistUrl,
} from "./catalog";

function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/** Opens a playlist in the Spotify app when installed, otherwise in the browser. */
export function openSpotifyPlaylist(playlistId: string): void {
  if (typeof window === "undefined") return;

  const webUrl = spotifyPlaylistUrl(playlistId);

  if (isMobileUserAgent()) {
    window.location.href = spotifyPlaylistDeepLink(playlistId);
    window.setTimeout(() => {
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }, 500);
    return;
  }

  const opened = window.open(webUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.assign(webUrl);
  }
}
