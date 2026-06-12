export const STRAVA_OAUTH_AUTHORIZE_URL =
  "https://www.strava.com/oauth/authorize";
export const STRAVA_OAUTH_TOKEN_URL = "https://www.strava.com/oauth/token";
export const STRAVA_API_BASE = "https://www.strava.com/api/v3";

/** Read profile + all activities including those with "Only Me" visibility. */
export const STRAVA_OAUTH_SCOPE = "read,activity:read_all";

export interface StravaTokenResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete?: {
    id: number;
  };
}

export interface StravaActivitySummary {
  id: number;
  name: string;
  sportType: string;
  startedAt: string;
  elapsedSeconds: number;
  movingSeconds: number | null;
  distanceMeters: number | null;
  elevationGainMeters: number | null;
  calories: number | null;
  averageHeartrate: number | null;
}

interface StravaActivityApi {
  id: number;
  name: string;
  sport_type?: string;
  type?: string;
  start_date: string;
  elapsed_time: number;
  moving_time?: number;
  distance?: number;
  total_elevation_gain?: number;
  calories?: number;
  average_heartrate?: number;
}

export function buildStravaAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}): string {
  const url = new URL(STRAVA_OAUTH_AUTHORIZE_URL);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", params.scope ?? STRAVA_OAUTH_SCOPE);
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("state", params.state);
  return url.toString();
}

async function postStravaToken(
  body: URLSearchParams
): Promise<StravaTokenResponse> {
  const response = await fetch(STRAVA_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = (await response.json()) as StravaTokenResponse & {
    message?: string;
    errors?: Array<{ resource?: string; field?: string; code?: string }>;
  };

  if (!response.ok) {
    throw new Error(json.message ?? "Strava token exchange failed.");
  }

  return json;
}

export async function exchangeStravaAuthorizationCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
}): Promise<StravaTokenResponse> {
  return postStravaToken(
    new URLSearchParams({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code,
      grant_type: "authorization_code",
    })
  );
}

export async function refreshStravaAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<StravaTokenResponse> {
  return postStravaToken(
    new URLSearchParams({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      refresh_token: params.refreshToken,
      grant_type: "refresh_token",
    })
  );
}

function mapStravaActivity(activity: StravaActivityApi): StravaActivitySummary {
  return {
    id: activity.id,
    name: activity.name?.trim() || "Strava activity",
    sportType: activity.sport_type ?? activity.type ?? "Workout",
    startedAt: activity.start_date,
    elapsedSeconds: activity.elapsed_time,
    movingSeconds:
      activity.moving_time != null ? activity.moving_time : null,
    distanceMeters: activity.distance ?? null,
    elevationGainMeters: activity.total_elevation_gain ?? null,
    calories: activity.calories ?? null,
    averageHeartrate: activity.average_heartrate ?? null,
  };
}

export async function fetchStravaActivities(params: {
  accessToken: string;
  afterUnix: number;
  perPage?: number;
  maxPages?: number;
}): Promise<StravaActivitySummary[]> {
  const perPage = params.perPage ?? 50;
  const maxPages = params.maxPages ?? 20;
  const activities: StravaActivitySummary[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const url = new URL(`${STRAVA_API_BASE}/athlete/activities`);
    url.searchParams.set("after", String(params.afterUnix));
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${params.accessToken}` },
    });

    const json = (await response.json()) as
      | StravaActivityApi[]
      | { message?: string };

    if (!response.ok) {
      const message =
        !Array.isArray(json) && json.message
          ? json.message
          : `Strava API error (${response.status})`;
      throw new Error(message);
    }

    if (!Array.isArray(json) || json.length === 0) {
      break;
    }

    activities.push(...json.map(mapStravaActivity));

    if (json.length < perPage) {
      break;
    }
  }

  return activities;
}

export function stravaTokenExpiresAtIso(token: StravaTokenResponse): string {
  if (token.expires_at) {
    return new Date(token.expires_at * 1000).toISOString();
  }
  return new Date(Date.now() + token.expires_in * 1000).toISOString();
}
