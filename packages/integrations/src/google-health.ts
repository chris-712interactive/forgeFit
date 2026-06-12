/**
 * Google Health API client — the current Fitbit data path (legacy Fitbit Web API
 * sunsets Sept 2026). Uses Google OAuth 2.0 + health.googleapis.com/v4.
 *
 * @see https://developers.google.com/health/migration
 */

export const GOOGLE_HEALTH_ACTIVITY_SCOPE =
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly";

export const GOOGLE_OAUTH_AUTHORIZE_URL =
  "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_HEALTH_API_BASE = "https://health.googleapis.com/v4";

export interface GoogleOAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface GoogleHealthIdentity {
  legacyUserId?: string;
  healthUserId?: string;
}

export interface DailyActivitySummary {
  date: string;
  steps: number | null;
  activeCalories: number | null;
  activeMinutes: number | null;
}

interface CivilDateParts {
  year: number;
  month: number;
  day: number;
}

interface CivilDateTime {
  date: CivilDateParts;
  time?: {
    hours?: number;
    minutes?: number;
    seconds?: number;
    nanos?: number;
  };
}

interface DailyRollupPoint {
  civilStartTime?: CivilDateTime;
  steps?: { countSum?: string | number };
  activeEnergyBurned?: {
    energySum?: string | number;
    kilocaloriesSum?: string | number;
  };
  activeMinutes?: { durationSum?: string | number; minutesSum?: string | number };
}

function parseCount(value: string | number | undefined): number | null {
  if (value == null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num);
}

function parseEnergy(value: string | number | undefined): number | null {
  if (value == null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 10) / 10;
}

function civilStartToIso(civilStartTime: CivilDateTime | undefined): string | null {
  if (!civilStartTime?.date) return null;
  const { year, month, day } = civilStartTime.date;
  if (!year || !month || !day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isoDateToCivilStart(isoDate: string): CivilDateTime {
  const [year, month, day] = isoDate.split("-").map(Number);
  return {
    date: { year, month, day },
    time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 },
  };
}

function isoDateToCivilEnd(isoDate: string): CivilDateTime {
  const [year, month, day] = isoDate.split("-").map(Number);
  return {
    date: { year, month, day },
    time: { hours: 23, minutes: 59, seconds: 59, nanos: 0 },
  };
}

export function buildGoogleHealthAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
  /** Force refresh token when reusing an OAuth client already used for sign-in. */
  prompt?: "consent" | "select_account";
}): string {
  const url = new URL(GOOGLE_OAUTH_AUTHORIZE_URL);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    params.scope ?? GOOGLE_HEALTH_ACTIVITY_SCOPE
  );
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("state", params.state);
  if (params.prompt) {
    url.searchParams.set("prompt", params.prompt);
  }
  // Do NOT set include_granted_scopes — mixed legacy fitness.* scopes break data reads.
  return url.toString();
}

async function postGoogleToken(
  body: URLSearchParams
): Promise<GoogleOAuthTokenResponse> {
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = (await response.json()) as GoogleOAuthTokenResponse & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw new Error(
      json.error_description ?? json.error ?? "Google token exchange failed."
    );
  }

  return json;
}

export async function exchangeGoogleHealthAuthorizationCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<GoogleOAuthTokenResponse> {
  return postGoogleToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: params.clientId,
      client_secret: params.clientSecret,
    })
  );
}

export async function refreshGoogleHealthAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<GoogleOAuthTokenResponse> {
  return postGoogleToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: params.refreshToken,
      client_id: params.clientId,
      client_secret: params.clientSecret,
    })
  );
}

async function googleHealthFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${GOOGLE_HEALTH_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const json = (await response.json()) as T & {
    error?: { message?: string; status?: string };
  };

  if (!response.ok) {
    const message =
      json.error?.message ??
      `Google Health API error (${response.status}) on ${path}`;
    throw new Error(message);
  }

  return json;
}

export async function fetchGoogleHealthIdentity(
  accessToken: string
): Promise<GoogleHealthIdentity> {
  const body = await googleHealthFetch<{
    legacyUserId?: string;
    healthUserId?: string;
  }>(accessToken, "/users/me/identity");

  return {
    legacyUserId: body.legacyUserId,
    healthUserId: body.healthUserId,
  };
}

async function fetchDailyRollup(
  accessToken: string,
  dataType: "steps" | "active-energy-burned" | "active-minutes",
  startDate: string,
  endDate: string
): Promise<DailyRollupPoint[]> {
  const body = {
    range: {
      start: isoDateToCivilStart(startDate),
      end: isoDateToCivilEnd(endDate),
    },
    windowSizeDays: 1,
  };

  const response = await googleHealthFetch<{ rollupDataPoints?: DailyRollupPoint[] }>(
    accessToken,
    `/users/me/dataTypes/${dataType}/dataPoints:dailyRollUp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  return response.rollupDataPoints ?? [];
}

export async function fetchDailyActivitySummaries(params: {
  accessToken: string;
  startDate: string;
  endDate: string;
}): Promise<DailyActivitySummary[]> {
  const [stepsRollups, energyRollups, minutesRollups] = await Promise.all([
    fetchDailyRollup(
      params.accessToken,
      "steps",
      params.startDate,
      params.endDate
    ),
    fetchDailyRollup(
      params.accessToken,
      "active-energy-burned",
      params.startDate,
      params.endDate
    ),
    fetchDailyRollup(
      params.accessToken,
      "active-minutes",
      params.startDate,
      params.endDate
    ),
  ]);

  const byDate = new Map<string, DailyActivitySummary>();

  function ensure(date: string): DailyActivitySummary {
    const existing = byDate.get(date);
    if (existing) return existing;
    const created: DailyActivitySummary = {
      date,
      steps: null,
      activeCalories: null,
      activeMinutes: null,
    };
    byDate.set(date, created);
    return created;
  }

  for (const point of stepsRollups) {
    const date = civilStartToIso(point.civilStartTime);
    if (!date) continue;
    ensure(date).steps = parseCount(point.steps?.countSum);
  }

  for (const point of energyRollups) {
    const date = civilStartToIso(point.civilStartTime);
    if (!date) continue;
    const energy =
      point.activeEnergyBurned?.kilocaloriesSum ??
      point.activeEnergyBurned?.energySum;
    ensure(date).activeCalories = parseEnergy(energy);
  }

  for (const point of minutesRollups) {
    const date = civilStartToIso(point.civilStartTime);
    if (!date) continue;
    const minutes =
      point.activeMinutes?.minutesSum ?? point.activeMinutes?.durationSum;
    ensure(date).activeMinutes = parseCount(minutes);
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
