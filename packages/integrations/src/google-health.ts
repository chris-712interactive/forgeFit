/**
 * Google Health API client — the current Fitbit data path (legacy Fitbit Web API
 * sunsets Sept 2026). Uses Google OAuth 2.0 + health.googleapis.com/v4.
 *
 * @see https://developers.google.com/health/migration
 */

export const GOOGLE_HEALTH_ACTIVITY_SCOPE =
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly";

export const GOOGLE_HEALTH_SLEEP_SCOPE =
  "https://www.googleapis.com/auth/googlehealth.sleep.readonly";

export const GOOGLE_HEALTH_METRICS_SCOPE =
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly";

/** Scopes requested when connecting Fitbit via Google Health. */
export const GOOGLE_HEALTH_FITBIT_SCOPES = [
  GOOGLE_HEALTH_ACTIVITY_SCOPE,
  GOOGLE_HEALTH_SLEEP_SCOPE,
  GOOGLE_HEALTH_METRICS_SCOPE,
].join(" ");

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

export interface DailySleepSummary {
  /** Wake date (civil end date of the main sleep session). */
  date: string;
  durationMinutes: number | null;
  minutesInBed: number | null;
  deepMinutes: number | null;
  remMinutes: number | null;
  awakeMinutes: number | null;
}

export interface DailyRecoverySummary {
  date: string;
  restingHrMin: number | null;
  restingHrMax: number | null;
  hrvMsMin: number | null;
  hrvMsMax: number | null;
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

interface ActiveEnergyBurnedRollupValue {
  /** REST field from ActiveEnergyBurnedRollupValue. */
  kcalSum?: string | number;
}

interface ActiveMinutesRollupValue {
  activeMinutesRollupByActivityLevel?: Array<{
    activityLevel?: string;
    activeMinutesSum?: string | number;
  }>;
}

interface DailyRollupPoint {
  civilStartTime?: CivilDateTime;
  steps?: { countSum?: string | number };
  activeEnergyBurned?: ActiveEnergyBurnedRollupValue;
  activeMinutes?: ActiveMinutesRollupValue;
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

function parseActiveMinutesRollup(
  rollup: ActiveMinutesRollupValue | undefined
): number | null {
  const levels = rollup?.activeMinutesRollupByActivityLevel;
  if (!levels || levels.length === 0) {
    return null;
  }

  let sum = 0;
  let hasValue = false;
  for (const level of levels) {
    const parsed = parseCount(level.activeMinutesSum);
    if (parsed != null) {
      sum += parsed;
      hasValue = true;
    }
  }

  return hasValue ? sum : null;
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

/** dailyRollUp ranges use an exclusive end — midnight on the day after `endDate`. */
function isoDateToCivilEndExclusive(endDate: string): CivilDateTime {
  return isoDateToCivilStart(addDaysIso(endDate, 1));
}

const DAILY_ROLLUP_MAX_DAYS: Record<
  "steps" | "active-energy-burned" | "active-minutes",
  number
> = {
  steps: 90,
  "active-energy-burned": 90,
  "active-minutes": 14,
};

type DailyRollupDataType = keyof typeof DAILY_ROLLUP_MAX_DAYS;

function chunkIsoDateRange(
  startDate: string,
  endDate: string,
  maxDays: number
): Array<{ startDate: string; endDate: string }> {
  if (startDate > endDate) return [];

  const chunks: Array<{ startDate: string; endDate: string }> = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    const chunkEnd = addDaysIso(cursor, maxDays - 1);
    const boundedEnd = chunkEnd > endDate ? endDate : chunkEnd;
    chunks.push({ startDate: cursor, endDate: boundedEnd });
    cursor = addDaysIso(boundedEnd, 1);
  }

  return chunks;
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
    params.scope ?? GOOGLE_HEALTH_FITBIT_SCOPES
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
  init?: RequestInit,
  context?: string
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
    const apiMessage = json.error?.message;
    const message = apiMessage
      ? context
        ? `${context}: ${apiMessage}`
        : apiMessage
      : `Google Health API error (${response.status}) on ${path}`;
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
  dataType: DailyRollupDataType,
  startDate: string,
  endDate: string
): Promise<DailyRollupPoint[]> {
  const body = {
    range: {
      start: isoDateToCivilStart(startDate),
      end: isoDateToCivilEndExclusive(endDate),
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
    },
    `Google Health ${dataType} (${startDate} to ${endDate})`
  );

  return response.rollupDataPoints ?? [];
}

async function fetchDailyRollupChunked(
  accessToken: string,
  dataType: DailyRollupDataType,
  startDate: string,
  endDate: string
): Promise<DailyRollupPoint[]> {
  const maxDays = DAILY_ROLLUP_MAX_DAYS[dataType];
  const chunks = chunkIsoDateRange(startDate, endDate, maxDays);
  const points: DailyRollupPoint[] = [];

  for (const chunk of chunks) {
    const batch = await fetchDailyRollup(
      accessToken,
      dataType,
      chunk.startDate,
      chunk.endDate
    );
    points.push(...batch);
  }

  return points;
}

export async function fetchDailyActivitySummaries(params: {
  accessToken: string;
  startDate: string;
  endDate: string;
}): Promise<DailyActivitySummary[]> {
  const [stepsRollups, energyRollups, minutesRollups] = await Promise.all([
    fetchDailyRollupChunked(
      params.accessToken,
      "steps",
      params.startDate,
      params.endDate
    ),
    fetchDailyRollupChunked(
      params.accessToken,
      "active-energy-burned",
      params.startDate,
      params.endDate
    ),
    fetchDailyRollupChunked(
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
    ensure(date).activeCalories = parseEnergy(
      point.activeEnergyBurned?.kcalSum
    );
  }

  for (const point of minutesRollups) {
    const date = civilStartToIso(point.civilStartTime);
    if (!date) continue;
    ensure(date).activeMinutes = parseActiveMinutesRollup(point.activeMinutes);
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

interface SleepStageSummary {
  type?: string;
  minutes?: string | number;
}

interface SleepSummaryBlock {
  minutesAsleep?: string | number;
  minutesInSleepPeriod?: string | number;
  minutesAwake?: string | number;
  stagesSummary?: SleepStageSummary[];
}

interface SleepSession {
  interval?: {
    civilEndTime?: CivilDateTime;
  };
  metadata?: {
    nap?: boolean;
  };
  summary?: SleepSummaryBlock;
}

interface SleepDataPoint {
  sleep?: SleepSession;
}

function stageMinutes(
  summary: SleepSummaryBlock | undefined,
  stageType: string
): number | null {
  const match = summary?.stagesSummary?.find((stage) => stage.type === stageType);
  return parseCount(match?.minutes);
}

function aggregateSleepSessions(sessions: SleepSession[]): DailySleepSummary[] {
  const byDate = new Map<string, DailySleepSummary>();

  for (const session of sessions) {
    if (session.metadata?.nap) continue;

    const date = civilStartToIso(session.interval?.civilEndTime);
    if (!date) continue;

    const durationMinutes = parseCount(session.summary?.minutesAsleep);
    if (durationMinutes == null || durationMinutes <= 0) continue;

    const candidate: DailySleepSummary = {
      date,
      durationMinutes,
      minutesInBed: parseCount(session.summary?.minutesInSleepPeriod),
      deepMinutes: stageMinutes(session.summary, "DEEP"),
      remMinutes: stageMinutes(session.summary, "REM"),
      awakeMinutes: parseCount(session.summary?.minutesAwake),
    };

    const existing = byDate.get(date);
    if (
      !existing ||
      (candidate.durationMinutes ?? 0) > (existing.durationMinutes ?? 0)
    ) {
      byDate.set(date, candidate);
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchSleepDataPointsPage(
  accessToken: string,
  startDate: string,
  endDate: string,
  pageToken?: string
): Promise<{ sessions: SleepSession[]; nextPageToken?: string }> {
  const endExclusive = addDaysIso(endDate, 1);
  const filter = `sleep.interval.civil_end_time >= "${startDate}" AND sleep.interval.civil_end_time < "${endExclusive}"`;
  const params = new URLSearchParams({
    filter,
    pageSize: "25",
  });
  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const response = await googleHealthFetch<{
    dataPoints?: SleepDataPoint[];
    nextPageToken?: string;
  }>(
    accessToken,
    `/users/me/dataTypes/sleep/dataPoints?${params.toString()}`,
    undefined,
    `Google Health sleep (${startDate} to ${endDate})`
  );

  const sessions = (response.dataPoints ?? [])
    .map((point) => point.sleep)
    .filter((session): session is SleepSession => session != null);

  return {
    sessions,
    nextPageToken: response.nextPageToken,
  };
}

export async function fetchDailySleepSummaries(params: {
  accessToken: string;
  startDate: string;
  endDate: string;
}): Promise<DailySleepSummary[]> {
  const sessions: SleepSession[] = [];
  let pageToken: string | undefined;

  do {
    const page = await fetchSleepDataPointsPage(
      params.accessToken,
      params.startDate,
      params.endDate,
      pageToken
    );
    sessions.push(...page.sessions);
    pageToken = page.nextPageToken;
  } while (pageToken);

  return aggregateSleepSessions(sessions);
}

export function integrationHasSleepScope(scopes: string | null | undefined): boolean {
  return scopes?.includes("googlehealth.sleep.readonly") ?? false;
}

export function integrationHasRecoveryScope(
  scopes: string | null | undefined
): boolean {
  return (
    scopes?.includes("googlehealth.health_metrics_and_measurements.readonly") ??
    false
  );
}

function parseBpm(value: string | number | undefined): number | null {
  if (value == null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num);
}

interface CalendarDate {
  year?: number;
  month?: number;
  day?: number;
}

function calendarDateToIso(date: CalendarDate | undefined): string | null {
  if (!date?.year || !date?.month || !date?.day) return null;
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

type DailyListDataType =
  | "daily-resting-heart-rate"
  | "daily-heart-rate-variability";

const DAILY_LIST_FILTER_KEY: Record<DailyListDataType, string> = {
  "daily-resting-heart-rate": "daily_resting_heart_rate",
  "daily-heart-rate-variability": "daily_heart_rate_variability",
};

interface RecoveryListDataPoint {
  dailyRestingHeartRate?: {
    date?: CalendarDate;
    beatsPerMinute?: string | number;
  };
  dailyHeartRateVariability?: {
    date?: CalendarDate;
    averageHeartRateVariabilityMilliseconds?: number;
  };
}

async function fetchDailyListDataPointsPage(
  accessToken: string,
  dataType: DailyListDataType,
  startDate: string,
  endDate: string,
  pageToken?: string
): Promise<{ points: RecoveryListDataPoint[]; nextPageToken?: string }> {
  const endExclusive = addDaysIso(endDate, 1);
  const filterKey = DAILY_LIST_FILTER_KEY[dataType];
  const filter = `${filterKey}.date >= "${startDate}" AND ${filterKey}.date < "${endExclusive}"`;
  const params = new URLSearchParams({
    filter,
    pageSize: "100",
  });
  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const response = await googleHealthFetch<{
    dataPoints?: RecoveryListDataPoint[];
    nextPageToken?: string;
  }>(
    accessToken,
    `/users/me/dataTypes/${dataType}/dataPoints?${params.toString()}`,
    undefined,
    `Google Health ${dataType} (${startDate} to ${endDate})`
  );

  return {
    points: response.dataPoints ?? [],
    nextPageToken: response.nextPageToken,
  };
}

async function fetchAllDailyListDataPoints(
  accessToken: string,
  dataType: DailyListDataType,
  startDate: string,
  endDate: string
): Promise<RecoveryListDataPoint[]> {
  const points: RecoveryListDataPoint[] = [];
  let pageToken: string | undefined;

  do {
    const page = await fetchDailyListDataPointsPage(
      accessToken,
      dataType,
      startDate,
      endDate,
      pageToken
    );
    points.push(...page.points);
    pageToken = page.nextPageToken;
  } while (pageToken);

  return points;
}

export async function fetchDailyRecoverySummaries(params: {
  accessToken: string;
  startDate: string;
  endDate: string;
}): Promise<DailyRecoverySummary[]> {
  const [rhrPoints, hrvPoints] = await Promise.all([
    fetchAllDailyListDataPoints(
      params.accessToken,
      "daily-resting-heart-rate",
      params.startDate,
      params.endDate
    ),
    fetchAllDailyListDataPoints(
      params.accessToken,
      "daily-heart-rate-variability",
      params.startDate,
      params.endDate
    ),
  ]);

  const byDate = new Map<string, DailyRecoverySummary>();

  function ensure(date: string): DailyRecoverySummary {
    const existing = byDate.get(date);
    if (existing) return existing;
    const created: DailyRecoverySummary = {
      date,
      restingHrMin: null,
      restingHrMax: null,
      hrvMsMin: null,
      hrvMsMax: null,
    };
    byDate.set(date, created);
    return created;
  }

  for (const point of rhrPoints) {
    const daily = point.dailyRestingHeartRate;
    if (!daily) continue;
    const date = calendarDateToIso(daily.date);
    if (!date) continue;
    const bpm = parseBpm(daily.beatsPerMinute);
    if (bpm == null) continue;
    const row = ensure(date);
    row.restingHrMin = bpm;
    row.restingHrMax = bpm;
  }

  for (const point of hrvPoints) {
    const daily = point.dailyHeartRateVariability;
    if (!daily) continue;
    const date = calendarDateToIso(daily.date);
    if (!date) continue;
    const hrv = parseBpm(daily.averageHeartRateVariabilityMilliseconds);
    if (hrv == null) continue;
    const row = ensure(date);
    row.hrvMsMin = hrv;
    row.hrvMsMax = hrv;
  }

  return [...byDate.values()]
    .filter(
      (row) =>
        row.restingHrMin != null ||
        row.restingHrMax != null ||
        row.hrvMsMin != null ||
        row.hrvMsMax != null
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}
