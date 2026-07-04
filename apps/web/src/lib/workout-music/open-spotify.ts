import { spotifyPlaylistUrl } from "./catalog";
import { isStandalonePwa } from "@/lib/pwa/standalone";

function isIosMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroidMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/** Native Spotify app URI — opens the installed app directly. */
export function spotifyNativePlaylistUrl(playlistId: string): string {
  return `spotify:playlist:${playlistId}`;
}

/** Android intent hands off to the Spotify app from an installed PWA webview. */
function spotifyAndroidIntentUrl(playlistId: string): string {
  const webUrl = spotifyPlaylistUrl(playlistId);
  const path = `open.spotify.com/playlist/${playlistId}`;
  return `intent://${path}#Intent;scheme=https;package=com.spotify.music;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
}

/**
 * Installed mobile PWAs load https://open.spotify.com inside the webview.
 * Use native app URIs there instead of universal https links.
 */
function shouldUseNativeSpotifyHandoff(): boolean {
  return isStandalonePwa() && (isIosMobile() || isAndroidMobile());
}

/** Opens a playlist in the Spotify app when installed, otherwise in the browser. */
export function openSpotifyPlaylist(playlistId: string): void {
  if (typeof window === "undefined") return;

  if (shouldUseNativeSpotifyHandoff()) {
    const nativeUrl = isAndroidMobile()
      ? spotifyAndroidIntentUrl(playlistId)
      : spotifyNativePlaylistUrl(playlistId);
    window.location.assign(nativeUrl);
    return;
  }

  const webUrl = spotifyPlaylistUrl(playlistId);
  const link = document.createElement("a");
  link.href = webUrl;
  link.rel = "noopener noreferrer";

  // Mobile Safari (not installed PWA): same-context https can hand off via universal links.
  if (isIosMobile()) {
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }

  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
