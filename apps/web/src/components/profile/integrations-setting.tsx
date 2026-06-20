"use client";

import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import type { IntegrationProvider } from "@forgefit/integrations";
import { integrationHasRecoveryScope, integrationHasSleepScope } from "@forgefit/integrations";
import type { IntegrationPublicStatus } from "@/lib/integrations/types";
import { formatIntegrationErrorForUser } from "@/lib/integrations/user-errors";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type HubIntegration = IntegrationPublicStatus & {
  label: string;
  description: string;
  available: boolean;
};

interface IntegrationsSettingProps {
  unlocked: boolean;
  configured: boolean;
  providerConfigured: Partial<Record<IntegrationProvider, boolean>>;
  providerOAuthRedirectUris?: Partial<Record<IntegrationProvider, string>>;
  initialIntegrations: HubIntegration[];
  integrationStatus?: string | null;
  integrationError?: string | null;
}

function formatSyncTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function syncSuccessMessage(
  provider: IntegrationProvider,
  imported: number,
  skipped: number,
  sleepImported?: number,
  recoveryImported?: number
): string {
  if (provider === "withings") {
    return `Imported ${imported} weigh-in${imported === 1 ? "" : "s"}${
      skipped ? ` (${skipped} unchanged)` : ""
    }.`;
  }

  if (provider === "fitbit") {
    const sleepPart =
      sleepImported != null && sleepImported > 0
        ? `, ${sleepImported} night${sleepImported === 1 ? "" : "s"} of sleep`
        : "";
    const recoveryPart =
      recoveryImported != null && recoveryImported > 0
        ? `, ${recoveryImported} day${recoveryImported === 1 ? "" : "s"} of recovery metrics`
        : "";
    return `Imported ${imported} day${imported === 1 ? "" : "s"} of activity${sleepPart}${recoveryPart}${
      skipped ? ` (${skipped} activity rows unchanged)` : ""
    }.`;
  }

  if (provider === "strava") {
    return `Imported ${imported} workout${imported === 1 ? "" : "s"}${
      skipped ? ` (${skipped} unchanged)` : ""
    }.`;
  }

  return `Imported ${imported} record${imported === 1 ? "" : "s"}.`;
}

function connectDisclosure(provider: IntegrationProvider): string | null {
  if (provider === "withings") {
    return "By connecting, you authorize ForgeRep to access weight readings from your Withings account.";
  }
  if (provider === "fitbit") {
    return "By connecting, you sign in with Google and authorize ForgeRep to read Fitbit activity, sleep, and recovery metrics (resting HR, HRV) through the Google Health API. Your Fitbit account must be linked to the same Google account in the Fitbit app first.";
  }
  if (provider === "strava") {
    return "By connecting, you authorize ForgeRep to import your Strava runs, rides, and other cardio workouts.";
  }
  return null;
}

export function IntegrationsSetting({
  unlocked,
  configured,
  providerConfigured,
  providerOAuthRedirectUris,
  initialIntegrations,
  integrationStatus,
  integrationError,
}: IntegrationsSettingProps) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [integrations, setIntegrations] =
    useState<HubIntegration[]>(initialIntegrations);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    integrationError
      ? formatIntegrationErrorForUser(integrationError)
      : null
  );
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  useEffect(() => {
    if (integrationError) {
      setError(formatIntegrationErrorForUser(integrationError));
    }
  }, [integrationError]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("integration_error");
    if (urlError) {
      setError(formatIntegrationErrorForUser(urlError));
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  function dismissIntegrationFeedback() {
    setError(null);
    setMessage(null);
    router.replace("/profile#integrations", { scroll: false });
  }

  useEffect(() => {
    if (integrationStatus === "withings_connected") {
      setMessage("Withings connected. Your latest weigh-ins were imported.");
      router.replace("/profile#integrations", { scroll: false });
    }
    if (integrationStatus === "fitbit_connected") {
      setMessage(
        "Fitbit connected via Google. Tap Sync now if your activity has not imported yet."
      );
      void refreshStatuses();
      router.replace("/profile#integrations", { scroll: false });
    }
    if (integrationStatus === "strava_connected") {
      setMessage(
        "Strava connected. Tap Sync now if your recent workouts have not imported yet."
      );
      void refreshStatuses();
      router.replace("/profile#integrations", { scroll: false });
    }
  }, [integrationStatus, router]);

  async function refreshStatuses() {
    const response = await fetch("/api/integrations");
    if (!response.ok) return;
    const body = (await response.json()) as {
      integrations?: HubIntegration[];
    };
    if (body.integrations) {
      setIntegrations(body.integrations);
    }
  }

  async function handleSync(provider: IntegrationProvider) {
    setBusyProvider(`${provider}-sync`);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/integrations/${provider}/sync`, {
        method: "POST",
      });
      const body = (await response.json()) as {
        error?: string;
        imported?: number;
        skipped?: number;
        sleepImported?: number;
        recoveryImported?: number;
      };

      if (!response.ok) {
        setError(formatIntegrationErrorForUser(body.error ?? "Sync failed. Try again."));
        return;
      }

      setMessage(
        syncSuccessMessage(
          provider,
          body.imported ?? 0,
          body.skipped ?? 0,
          body.sleepImported,
          body.recoveryImported
        )
      );
      await refreshStatuses();
      router.refresh();
    } catch {
      setError("Sync failed. Check your connection and try again.");
    } finally {
      setBusyProvider(null);
    }
  }

  async function handleDisconnect(provider: IntegrationProvider) {
    setBusyProvider(`${provider}-disconnect`);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/integrations/${provider}/disconnect`, {
        method: "POST",
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(body.error ?? "Could not disconnect.");
        return;
      }

      setMessage("Integration disconnected.");
      await refreshStatuses();
    } catch {
      setError("Could not disconnect. Try again.");
    } finally {
      setBusyProvider(null);
    }
  }

  return (
    <section
      ref={sectionRef}
      id="integrations"
      className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-5"
    >
      <h2 className="font-display text-sm font-semibold text-forge-text">
        Integrations
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Connect devices and apps to keep Progress up to date automatically.{" "}
        <Link
          href="/privacy#integrations"
          className="font-medium text-forge-steel hover:underline"
        >
          How integrations use your data
        </Link>
      </p>

      {error && (
        <div
          className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3"
          role="alert"
        >
          <p className="font-display text-sm font-semibold text-red-100">
            Could not connect
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-red-100/90">
            {error}
          </p>
          <button
            type="button"
            onClick={dismissIntegrationFeedback}
            className="mt-3 text-xs font-semibold text-red-200 underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {message && !error && (
        <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3">
          <p className="text-sm font-medium text-emerald-100">{message}</p>
          <button
            type="button"
            onClick={dismissIntegrationFeedback}
            className="mt-2 text-xs font-semibold text-emerald-200 underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {!configured && unlocked && (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
          Device integrations are not fully configured in this environment yet.
        </p>
      )}

      {!unlocked && (
        <div className="mt-4">
          <UpgradePrompt
            title="Pro+ integrations"
            description="Sync weight from Withings and import activity from Fitbit. Strava and more coming soon."
            suggestedTier="pro_plus"
            href="/profile#subscription"
          />
        </div>
      )}

      {unlocked && (
        <ul className="mt-4 space-y-3">
          {integrations.map((integration) => {
            const lastSync = formatSyncTime(integration.lastSyncAt);
            const isConfigured =
              providerConfigured[integration.provider] ?? false;
            const connectHref =
              integration.available && isConfigured
                ? `/api/integrations/${integration.provider}/connect`
                : null;
            const disclosure = connectDisclosure(integration.provider);
            const oauthRedirectUri =
              providerOAuthRedirectUris?.[integration.provider];
            const showOAuthHint =
              integration.provider === "withings" &&
              isConfigured &&
              !integration.connected &&
              oauthRedirectUri;

            return (
              <li
                key={integration.provider}
                className="rounded-xl border border-[var(--border)] bg-forge-surface p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-forge-text">
                      {integration.label}
                    </p>
                    <p className="mt-1 text-xs text-forge-muted">
                      {integration.description}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      integration.connected && integration.status === "error"
                        ? "bg-amber-500/15 text-amber-200"
                        : integration.connected
                          ? "bg-emerald-500/15 text-emerald-300"
                          : integration.available
                            ? "bg-forge-surface-raised text-forge-muted"
                            : "bg-forge-surface-raised text-forge-muted"
                    }`}
                  >
                    {integration.connected && integration.status === "error"
                      ? "Sync issue"
                      : integration.connected
                        ? "Connected"
                        : integration.available
                          ? "Available"
                          : "Coming soon"}
                  </span>
                </div>

                {integration.connected && lastSync && (
                  <p className="mt-2 text-xs text-forge-muted">
                    Last sync: {lastSync}
                  </p>
                )}

                {integration.connected && integration.lastSyncError && (
                  <p className="mt-2 text-xs text-red-300">
                    {integration.lastSyncError}
                  </p>
                )}

                {integration.provider === "fitbit" &&
                  integration.connected &&
                  (!integrationHasSleepScope(integration.scopes) ||
                    !integrationHasRecoveryScope(integration.scopes)) && (
                    <p className="mt-2 text-xs text-forge-gold">
                      Reconnect Fitbit to enable{" "}
                      {!integrationHasSleepScope(integration.scopes)
                        ? "sleep"
                        : ""}
                      {!integrationHasSleepScope(integration.scopes) &&
                      !integrationHasRecoveryScope(integration.scopes)
                        ? " and "
                        : ""}
                      {!integrationHasRecoveryScope(integration.scopes)
                        ? "recovery metrics"
                        : ""}{" "}
                      import.
                    </p>
                  )}

                {integration.available && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {integration.connected ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleSync(integration.provider)}
                          disabled={busyProvider != null}
                          className="min-h-[40px] rounded-lg bg-forge-ember px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-forge-glow disabled:opacity-60"
                        >
                          {busyProvider === `${integration.provider}-sync`
                            ? "Syncing…"
                            : "Sync now"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handleDisconnect(integration.provider)
                          }
                          disabled={busyProvider != null}
                          className="min-h-[40px] rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-forge-text transition-colors hover:border-red-400/40 disabled:opacity-60"
                        >
                          {busyProvider === `${integration.provider}-disconnect`
                            ? "Disconnecting…"
                            : "Disconnect"}
                        </button>
                      </>
                    ) : connectHref ? (
                      <div className="w-full space-y-2">
                        {showOAuthHint && (
                          <p className="rounded-xl border border-[var(--border)] bg-forge-surface px-3 py-2 text-[11px] leading-relaxed text-forge-muted">
                            Register this callback URL in the Withings Partner
                            Hub (Registered URLs):{" "}
                            <code className="break-all text-forge-steel">
                              {oauthRedirectUri}
                            </code>
                          </p>
                        )}
                        {disclosure && (
                          <p className="text-[11px] leading-relaxed text-forge-muted">
                            {disclosure} You can disconnect anytime.{" "}
                            <Link
                              href="/privacy#integrations"
                              className="font-medium text-forge-steel hover:underline"
                            >
                              Privacy details
                            </Link>
                          </p>
                        )}
                        <a
                          href={connectHref}
                          className="inline-flex min-h-[40px] items-center rounded-lg bg-forge-ember px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-forge-glow"
                        >
                          Connect
                        </a>
                      </div>
                    ) : (
                      <p className="text-[11px] text-forge-muted">
                        OAuth credentials for this provider are not configured
                        yet.
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
