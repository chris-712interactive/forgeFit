import {
  exchangeSpotifyAuthorizationCode,
  fetchSpotifyPlaybackState,
  fetchSpotifyProfile,
  refreshSpotifyAccessToken,
  resolveSpotifyControlDeviceId,
  resumeSpotifyPlayback,
  spotifyPlaybackControl,
  spotifyPlaylistContextUri,
  spotifyTokenExpiresAtIso,
  startSpotifyPlaybackResolved,
  type SpotifyPlaybackAction,
  type SpotifyPlaybackState,
} from "@forgefit/integrations";
import {
  getWorkoutMusicPlaylist,
  isWorkoutMusicVibe,
  type WorkoutMusicVibe,
} from "@/lib/workout-music/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getSpotifyClientConfig,
  spotifyOAuthRedirectUri,
} from "./config";
import {
  decryptIntegrationSecret,
  encryptIntegrationSecret,
} from "./crypto";
import { disconnectIntegration, getIntegrationRow } from "./service";
import type { UserIntegrationRow } from "./types";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

export interface SpotifyPublicStatus {
  configured: boolean;
  connected: boolean;
  autoStart: boolean;
  defaultVibe: WorkoutMusicVibe | null;
  lastError: string | null;
  /** Register this exact URI in the Spotify Developer Dashboard. */
  oauthRedirectUri?: string;
}

export interface SpotifyPlaybackView {
  connected: boolean;
  configured: boolean;
  isPlaying: boolean;
  trackName: string | null;
  artistName: string | null;
  premiumRequired: boolean;
  noActiveDevice: boolean;
  message: string | null;
}

export async function getSpotifyPublicStatus(
  userId: string,
  profile?: {
    workout_music_auto_start?: boolean | null;
    workout_music_default_vibe?: string | null;
  } | null,
  request?: Request
): Promise<SpotifyPublicStatus> {
  const configured = Boolean(
    process.env.SPOTIFY_CLIENT_ID?.trim() &&
      process.env.SPOTIFY_CLIENT_SECRET?.trim() &&
      process.env.INTEGRATIONS_TOKEN_ENCRYPTION_KEY?.trim()
  );

  const row = configured ? await getIntegrationRow(userId, "spotify") : null;
  const defaultVibeRaw = profile?.workout_music_default_vibe ?? null;

  return {
    configured,
    connected:
      row != null &&
      (row.status === "active" || row.status === "error"),
    autoStart: profile?.workout_music_auto_start ?? false,
    defaultVibe:
      defaultVibeRaw && isWorkoutMusicVibe(defaultVibeRaw)
        ? defaultVibeRaw
        : null,
    lastError: row?.last_sync_error ?? null,
    oauthRedirectUri: configured ? spotifyOAuthRedirectUri(request) : undefined,
  };
}

async function saveSpotifyConnection(params: {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
  externalUserId: string;
}): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin.from("user_integrations").upsert(
    {
      user_id: params.userId,
      provider: "spotify",
      external_user_id: params.externalUserId,
      access_token_encrypted: encryptIntegrationSecret(params.accessToken),
      refresh_token_encrypted: encryptIntegrationSecret(params.refreshToken),
      token_expires_at: spotifyTokenExpiresAtIso(params.expiresIn),
      scopes: params.scope,
      status: "active",
      last_sync_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function completeSpotifyOAuth(params: {
  userId: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<void> {
  const { clientId, clientSecret } = getSpotifyClientConfig();
  const token = await exchangeSpotifyAuthorizationCode({
    clientId,
    clientSecret,
    code: params.code,
    redirectUri: params.redirectUri,
    codeVerifier: params.codeVerifier,
  });

  if (!token.refresh_token) {
    throw new Error(
      "Spotify did not return a refresh token. Disconnect in Spotify account settings and try again."
    );
  }

  const profile = await fetchSpotifyProfile(token.access_token);

  await saveSpotifyConnection({
    userId: params.userId,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresIn: token.expires_in,
    scope: token.scope,
    externalUserId: profile.id,
  });
}

export async function disconnectSpotify(userId: string): Promise<void> {
  await disconnectIntegration(userId, "spotify");
}

async function getValidSpotifyAccessToken(
  row: UserIntegrationRow
): Promise<string> {
  const expiresAt = row.token_expires_at
    ? new Date(row.token_expires_at).getTime()
    : 0;

  if (expiresAt - Date.now() > TOKEN_REFRESH_BUFFER_MS) {
    return decryptIntegrationSecret(row.access_token_encrypted);
  }

  if (!row.refresh_token_encrypted) {
    throw new Error("Spotify refresh token is missing.");
  }

  const { clientId, clientSecret } = getSpotifyClientConfig();
  const refreshed = await refreshSpotifyAccessToken({
    clientId,
    clientSecret,
    refreshToken: decryptIntegrationSecret(row.refresh_token_encrypted),
  });

  const admin = createAdminClient();
  const { error } = await admin
    .from("user_integrations")
    .update({
      access_token_encrypted: encryptIntegrationSecret(refreshed.access_token),
      refresh_token_encrypted: refreshed.refresh_token
        ? encryptIntegrationSecret(refreshed.refresh_token)
        : row.refresh_token_encrypted,
      token_expires_at: spotifyTokenExpiresAtIso(refreshed.expires_in),
      status: "active",
      last_sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) {
    throw new Error(error.message);
  }

  return refreshed.access_token;
}

async function withSpotifyAccessToken<T>(
  userId: string,
  fn: (accessToken: string) => Promise<T>
): Promise<T> {
  const row = await getIntegrationRow(userId, "spotify");
  if (!row || row.status === "revoked") {
    throw new SpotifyNotConnectedError();
  }

  try {
    const accessToken = await getValidSpotifyAccessToken(row);
    return await fn(accessToken);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Spotify request failed.";
    const admin = createAdminClient();
    await admin
      .from("user_integrations")
      .update({
        status: "error",
        last_sync_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    throw error;
  }
}

export class SpotifyNotConnectedError extends Error {
  constructor() {
    super("Spotify is not connected.");
    this.name = "SpotifyNotConnectedError";
  }
}

function mapPlaybackState(state: SpotifyPlaybackState | null): Omit<
  SpotifyPlaybackView,
  "connected" | "configured" | "premiumRequired" | "noActiveDevice" | "message"
> {
  if (!state?.track) {
    return {
      isPlaying: state?.isPlaying ?? false,
      trackName: null,
      artistName: null,
    };
  }

  return {
    isPlaying: state.isPlaying,
    trackName: state.track.name,
    artistName: state.track.artists.map((artist) => artist.name).join(", "),
  };
}

export async function getSpotifyPlaybackView(
  userId: string
): Promise<SpotifyPlaybackView> {
  const configured = Boolean(
    process.env.SPOTIFY_CLIENT_ID?.trim() &&
      process.env.SPOTIFY_CLIENT_SECRET?.trim()
  );
  const row = await getIntegrationRow(userId, "spotify");
  const connected =
    row != null && (row.status === "active" || row.status === "error");

  if (!configured) {
    return {
      connected,
      configured: false,
      isPlaying: false,
      trackName: null,
      artistName: null,
      premiumRequired: false,
      noActiveDevice: false,
      message: "Spotify integration is not configured.",
    };
  }

  if (!connected) {
    return {
      connected: false,
      configured: true,
      isPlaying: false,
      trackName: null,
      artistName: null,
      premiumRequired: false,
      noActiveDevice: false,
      message: null,
    };
  }

  try {
    const result = await withSpotifyAccessToken(userId, async (accessToken) => {
      return fetchSpotifyPlaybackState(accessToken);
    });

    if (!result.ok) {
      if (result.status === 403) {
        return {
          connected: true,
          configured: true,
          isPlaying: false,
          trackName: null,
          artistName: null,
          premiumRequired: true,
          noActiveDevice: false,
          message:
            "In-app controls need Spotify Premium. You can still open playlists from the vibe picker.",
        };
      }

      return {
        connected: true,
        configured: true,
        isPlaying: false,
        trackName: null,
        artistName: null,
        premiumRequired: false,
        noActiveDevice: result.message === "NO_ACTIVE_DEVICE",
        message: result.message,
      };
    }

    return {
      connected: true,
      configured: true,
      premiumRequired: false,
      noActiveDevice: false,
      message: null,
      ...mapPlaybackState(result.state),
    };
  } catch (error) {
    if (error instanceof SpotifyNotConnectedError) {
      return {
        connected: false,
        configured: true,
        isPlaying: false,
        trackName: null,
        artistName: null,
        premiumRequired: false,
        noActiveDevice: false,
        message: null,
      };
    }

    const message =
      error instanceof Error ? error.message : "Could not load Spotify playback.";
    return {
      connected: true,
      configured: true,
      isPlaying: false,
      trackName: null,
      artistName: null,
      premiumRequired: false,
      noActiveDevice: false,
      message,
    };
  }
}

function resolveVibe(
  vibe: WorkoutMusicVibe | null | undefined,
  profileVibe: WorkoutMusicVibe | null
): WorkoutMusicVibe {
  if (vibe && isWorkoutMusicVibe(vibe)) return vibe;
  if (profileVibe) return profileVibe;
  return "pump";
}

export async function startSpotifyWorkoutPlaylist(params: {
  userId: string;
  vibe?: WorkoutMusicVibe | null;
  profileDefaultVibe?: WorkoutMusicVibe | null;
  requireAutoStart?: boolean;
  profileAutoStart?: boolean;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (params.requireAutoStart && !params.profileAutoStart) {
    return { ok: false, reason: "auto_start_disabled" };
  }

  const row = await getIntegrationRow(params.userId, "spotify");
  if (!row || row.status === "revoked") {
    return { ok: false, reason: "not_connected" };
  }

  const vibe = resolveVibe(params.vibe, params.profileDefaultVibe ?? null);
  const playlist = getWorkoutMusicPlaylist(vibe);
  if (!playlist) {
    return { ok: false, reason: "invalid_vibe" };
  }

  try {
    const result = await withSpotifyAccessToken(params.userId, async (accessToken) =>
      startSpotifyPlaybackResolved({
        accessToken,
        contextUri: spotifyPlaylistContextUri(playlist.spotifyPlaylistId),
      })
    );

    if (!result.ok) {
      if (result.status === 403) {
        return { ok: false, reason: "premium_required" };
      }
      if (result.status === 404 || result.message === "NO_ACTIVE_DEVICE") {
        return { ok: false, reason: "no_active_device" };
      }
      return { ok: false, reason: result.message };
    }

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not start Spotify playback.";
    return { ok: false, reason: message };
  }
}

export async function controlSpotifyPlayback(params: {
  userId: string;
  action: SpotifyPlaybackAction | "toggle";
  profileDefaultVibe?: WorkoutMusicVibe | null;
}): Promise<{ ok: true; isPlaying?: boolean } | { ok: false; reason: string }> {
  const row = await getIntegrationRow(params.userId, "spotify");
  if (!row || row.status === "revoked") {
    return { ok: false, reason: "not_connected" };
  }

  try {
    const result = await withSpotifyAccessToken(
      params.userId,
      async (accessToken) => {
        const stateResult = await fetchSpotifyPlaybackState(accessToken);
        const playbackDeviceId = stateResult.ok
          ? stateResult.state?.deviceId
          : null;

        let playbackAction: SpotifyPlaybackAction;
        if (params.action === "toggle") {
          playbackAction =
            stateResult.ok && stateResult.state?.isPlaying ? "pause" : "resume";
        } else {
          playbackAction = params.action;
        }

        if (playbackAction === "resume") {
          const resumeResult = await resumeSpotifyPlayback({
            accessToken,
            deviceId: playbackDeviceId,
          });
          if (resumeResult.ok) {
            return { controlResult: resumeResult, playbackAction };
          }

          const vibe = resolveVibe(undefined, params.profileDefaultVibe ?? null);
          const playlist = getWorkoutMusicPlaylist(vibe);
          if (!playlist) {
            return {
              controlResult: {
                ok: false as const,
                status: 404,
                message: "invalid_vibe",
              },
              playbackAction,
            };
          }

          const startResult = await startSpotifyPlaybackResolved({
            accessToken,
            contextUri: spotifyPlaylistContextUri(playlist.spotifyPlaylistId),
            deviceId: playbackDeviceId,
          });
          return { controlResult: startResult, playbackAction };
        }

        const deviceId = await resolveSpotifyControlDeviceId(
          accessToken,
          playbackDeviceId
        );
        const controlResult = await spotifyPlaybackControl(
          accessToken,
          playbackAction,
          deviceId
        );
        return { controlResult, playbackAction };
      }
    );

    if (!result.controlResult.ok) {
      if (result.controlResult.status === 403) {
        return { ok: false, reason: "premium_required" };
      }
      if (
        result.controlResult.status === 404 ||
        result.controlResult.message === "NO_ACTIVE_DEVICE"
      ) {
        return { ok: false, reason: "no_active_device" };
      }
      return { ok: false, reason: result.controlResult.message };
    }

    if (result.playbackAction === "pause") {
      return { ok: true, isPlaying: false };
    }
    if (result.playbackAction === "resume") {
      return { ok: true, isPlaying: true };
    }

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Spotify playback control failed.";
    return { ok: false, reason: message };
  }
}

export async function updateWorkoutMusicProfilePrefs(params: {
  userId: string;
  autoStart?: boolean;
  defaultVibe?: WorkoutMusicVibe | null;
}): Promise<void> {
  const supabase = await createClient();
  const patch: Record<string, boolean | string | null> = {};

  if (params.autoStart != null) {
    patch.workout_music_auto_start = params.autoStart;
  }

  if (params.defaultVibe !== undefined) {
    patch.workout_music_default_vibe = params.defaultVibe;
  }

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", params.userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getWorkoutMusicProfilePrefs(userId: string): Promise<{
  autoStart: boolean;
  defaultVibe: WorkoutMusicVibe | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("workout_music_auto_start, workout_music_default_vibe")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const defaultVibeRaw = data?.workout_music_default_vibe ?? null;

  return {
    autoStart: data?.workout_music_auto_start ?? false,
    defaultVibe:
      defaultVibeRaw && isWorkoutMusicVibe(defaultVibeRaw)
        ? defaultVibeRaw
        : null,
  };
}
