import { spotifyPlaylistUrl } from "./catalog";

function shouldOpenInSameContext(): boolean {
  if (typeof window === "undefined") return false;

  const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isStandalonePwa =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  // iOS and installed PWAs: target="_blank" opens an in-app browser (blank flash)
  // before Spotify. Same-context https links hand off to the native app via universal links.
  return isIos || isStandalonePwa;
}

/** Opens a playlist in the Spotify app when installed, otherwise in the browser. */
export function openSpotifyPlaylist(playlistId: string): void {
  if (typeof window === "undefined") return;

  const webUrl = spotifyPlaylistUrl(playlistId);
  const link = document.createElement("a");
  link.href = webUrl;
  link.rel = "noopener noreferrer";

  if (!shouldOpenInSameContext()) {
    link.target = "_blank";
  }

  document.body.appendChild(link);
  link.click();
  link.remove();
}
