export type IntegrationProvider = "withings" | "fitbit" | "strava" | "spotify";

export interface WithingsTokenBody {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  csrf_token?: string;
  userid: number;
}

export interface WithingsApiResponse<T> {
  status: number;
  body: T;
  error?: string;
}

export interface WithingsMeasureGroup {
  grpid: number;
  attrib: number;
  date: number;
  created: number;
  category: number;
  deviceid?: string | null;
  measures: WithingsMeasureValue[];
}

export interface WithingsMeasureValue {
  value: number;
  type: number;
  unit: number;
}

export interface WithingsMeasureResponse {
  updatetime: number;
  timezone: string;
  measuregrps: WithingsMeasureGroup[];
  more?: number;
  offset?: number;
}

/** Withings measure type 1 = weight (kg after unit scaling). */
export const WITHINGS_MEASURE_TYPE_WEIGHT = 1;

export function scaleWithingsMeasure(value: number, unit: number): number {
  return value * Math.pow(10, unit);
}

export function buildWithingsAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  scope?: string;
}): string {
  const url = new URL("https://account.withings.com/oauth2_user/authorize2");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("state", params.state);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", params.scope ?? "user.metrics");
  return url.toString();
}

async function parseWithingsResponse<T>(
  response: Response
): Promise<WithingsApiResponse<T>> {
  const json = (await response.json()) as WithingsApiResponse<T>;
  if (!response.ok || json.status !== 0) {
    throw new Error(json.error ?? `Withings API error (${json.status})`);
  }
  return json;
}

export async function exchangeWithingsAuthorizationCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<WithingsTokenBody> {
  const body = new URLSearchParams({
    action: "requesttoken",
    grant_type: "authorization_code",
    client_id: params.clientId,
    client_secret: params.clientSecret,
    code: params.code,
    redirect_uri: params.redirectUri,
  });

  const response = await fetch("https://wbsapi.withings.net/v2/oauth2", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await parseWithingsResponse<WithingsTokenBody>(response);
  return json.body;
}

export async function refreshWithingsAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<WithingsTokenBody> {
  const body = new URLSearchParams({
    action: "requesttoken",
    grant_type: "refresh_token",
    client_id: params.clientId,
    client_secret: params.clientSecret,
    refresh_token: params.refreshToken,
  });

  const response = await fetch("https://wbsapi.withings.net/v2/oauth2", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await parseWithingsResponse<WithingsTokenBody>(response);
  return json.body;
}

export async function fetchWithingsMeasures(params: {
  accessToken: string;
  fromUnix?: number;
  toUnix?: number;
  meastypes?: number[];
}): Promise<WithingsMeasureGroup[]> {
  const body = new URLSearchParams({
    action: "getmeas",
    access_token: params.accessToken,
  });

  if (params.fromUnix != null) {
    body.set("startdate", String(params.fromUnix));
  }
  if (params.toUnix != null) {
    body.set("enddate", String(params.toUnix));
  }
  if (params.meastypes?.length) {
    body.set("meastypes", params.meastypes.join(","));
  }

  const response = await fetch("https://wbsapi.withings.net/measure", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await parseWithingsResponse<WithingsMeasureResponse>(response);
  return json.body.measuregrps ?? [];
}

export function extractWeightKgFromGroup(
  group: WithingsMeasureGroup
): number | null {
  const weight = group.measures.find(
    (measure) => measure.type === WITHINGS_MEASURE_TYPE_WEIGHT
  );
  if (!weight) return null;

  const kg = scaleWithingsMeasure(weight.value, weight.unit);
  if (!Number.isFinite(kg) || kg <= 0) return null;
  return Math.round(kg * 10) / 10;
}

export function measureGroupToDate(group: WithingsMeasureGroup): string {
  return new Date(group.date * 1000).toISOString().slice(0, 10);
}
