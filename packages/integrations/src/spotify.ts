export const SPOTIFY_OAUTH_AUTHORIZE_URL =
  "https://accounts.spotify.com/authorize";
export const SPOTIFY_OAUTH_TOKEN_URL =
  "https://accounts.spotify.com/api/token";
export const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export const SPOTIFY_OAUTH_SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ");

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

export interface SpotifyProfile {
  id: string;
  display_name: string | null;
  product: string | null;
}

export interface SpotifyPlaybackTrack {
  name: string;
  artists: Array<{ name: string }>;
}

export interface SpotifyPlaybackState {
  isPlaying: boolean;
  progressMs: number | null;
  track: SpotifyPlaybackTrack | null;
  contextUri: string | null;
  deviceId: string | null;
}

export interface SpotifyApiErrorBody {
  error?: {
    status?: number;
    message?: string;
  };
}

export function buildSpotifyAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  scope?: string;
}): string {
  const url = new URL(SPOTIFY_OAUTH_AUTHORIZE_URL);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("scope", params.scope ?? SPOTIFY_OAUTH_SCOPES);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", params.codeChallenge);
  return url.toString();
}

async function postSpotifyToken(
  body: URLSearchParams,
  clientSecret: string
): Promise<SpotifyTokenResponse> {
  body.set("client_secret", clientSecret);

  const response = await fetch(SPOTIFY_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = (await response.json()) as SpotifyTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw new Error(
      json.error_description ?? json.error ?? "Spotify token request failed."
    );
  }

  return json;
}

export async function exchangeSpotifyAuthorizationCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<SpotifyTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    code_verifier: params.codeVerifier,
  });

  return postSpotifyToken(body, params.clientSecret);
}

export async function refreshSpotifyAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<SpotifyTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
    client_id: params.clientId,
  });

  return postSpotifyToken(body, params.clientSecret);
}

export function spotifyTokenExpiresAtIso(expiresIn: number): string {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

async function spotifyApiFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (response.status === 204) {
    return { ok: true, data: undefined as T };
  }

  if (response.status === 404) {
    return { ok: false, status: 404, message: "NO_ACTIVE_DEVICE" };
  }

  const text = await response.text();
  let json: SpotifyApiErrorBody | SpotifyPlaybackStateApi | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as SpotifyApiErrorBody | SpotifyPlaybackStateApi;
    } catch {
      json = null;
    }
  }

  if (!response.ok) {
    const message =
      (json as SpotifyApiErrorBody | null)?.error?.message ??
      text ??
      `Spotify API error (${response.status})`;
    return { ok: false, status: response.status, message };
  }

  return { ok: true, data: json as T };
}

export async function fetchSpotifyProfile(
  accessToken: string
): Promise<SpotifyProfile> {
  const result = await spotifyApiFetch<{
    id: string;
    display_name: string | null;
    product: string | null;
  }>(accessToken, "/me");

  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.data;
}

interface SpotifyPlaybackStateApi {
  is_playing: boolean;
  progress_ms: number | null;
  item: {
    name: string;
    artists: Array<{ name: string }>;
  } | null;
  context: {
    uri: string | null;
  } | null;
  device?: {
    id: string;
    is_active?: boolean;
  } | null;
}

function spotifyPlayerPath(path: string, deviceId?: string | null): string {
  if (!deviceId) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}device_id=${encodeURIComponent(deviceId)}`;
}

export async function fetchSpotifyPlaybackState(
  accessToken: string
): Promise<
  | { ok: true; state: SpotifyPlaybackState | null }
  | { ok: false; status: number; message: string }
> {
  const result = await spotifyApiFetch<SpotifyPlaybackStateApi | "">(
    accessToken,
    "/me/player"
  );

  if (!result.ok) {
    if (result.status === 404) {
      return { ok: true, state: null };
    }
    return result;
  }

  const data = result.data as SpotifyPlaybackStateApi | "";
  if (!data || typeof data !== "object" || !("is_playing" in data)) {
    return { ok: true, state: null };
  }

  return {
    ok: true,
    state: {
      isPlaying: data.is_playing,
      progressMs: data.progress_ms,
      track: data.item
        ? {
            name: data.item.name,
            artists: data.item.artists,
          }
        : null,
      contextUri: data.context?.uri ?? null,
      deviceId: data.device?.id ?? null,
    },
  };
}

export async function startSpotifyPlayback(params: {
  accessToken: string;
  contextUri: string;
  deviceId?: string | null;
}): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  return spotifyApiFetch(
    params.accessToken,
    spotifyPlayerPath("/me/player/play", params.deviceId),
    {
      method: "PUT",
      body: JSON.stringify({ context_uri: params.contextUri }),
    }
  );
}

export type SpotifyPlaybackAction = "pause" | "next" | "previous" | "resume";

export async function spotifyPlaybackControl(
  accessToken: string,
  action: SpotifyPlaybackAction,
  deviceId?: string | null
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  if (action === "resume") {
    return spotifyApiFetch(
      accessToken,
      spotifyPlayerPath("/me/player/play", deviceId),
      {
        method: "PUT",
        body: JSON.stringify({}),
      }
    );
  }

  if (action === "pause") {
    return spotifyApiFetch(
      accessToken,
      spotifyPlayerPath("/me/player/pause", deviceId),
      { method: "PUT" }
    );
  }

  const path =
    action === "next" ? "/me/player/next" : "/me/player/previous";

  return spotifyApiFetch(
    accessToken,
    spotifyPlayerPath(path, deviceId),
    { method: "POST" }
  );
}

export function spotifyPlaylistContextUri(playlistId: string): string {
  return `spotify:playlist:${playlistId}`;
}
