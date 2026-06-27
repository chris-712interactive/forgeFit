const DEFAULT_GA_MEASUREMENT_ID = "G-VDVFTLJ0NF";
const DEFAULT_GTM_CONTAINER_ID = "GTM-57PG354W";

function isDisabled(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "false" || normalized === "0" || normalized === "off";
}

function isExplicitlyEnabledInDev(envValue: string | undefined): boolean {
  return Boolean(envValue?.trim()) && !isDisabled(envValue);
}

export function getGtmContainerId(): string | null {
  const configured = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID?.trim();
  if (isDisabled(configured)) {
    return null;
  }

  if (configured) {
    return configured;
  }

  if (
    process.env.NODE_ENV === "development" &&
    !isExplicitlyEnabledInDev(process.env.NEXT_PUBLIC_GTM_CONTAINER_ID)
  ) {
    return null;
  }

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_GTM_CONTAINER_ID;
  }

  return null;
}

export function isGoogleTagManagerEnabled(): boolean {
  return getGtmContainerId() !== null;
}

export function getGaMeasurementId(): string | null {
  if (isGoogleTagManagerEnabled()) {
    return null;
  }

  const configured = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (isDisabled(configured)) {
    return null;
  }

  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_GA_MEASUREMENT_ID;
  }

  return null;
}

export function isGoogleAnalyticsEnabled(): boolean {
  return getGaMeasurementId() !== null;
}
