"use client";

import { UpgradePrompt } from "@/components/billing/upgrade-prompt";
import type { IntegrationPublicStatus } from "@/lib/integrations/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type HubIntegration = IntegrationPublicStatus & {
  label: string;
  description: string;
  available: boolean;
};

interface IntegrationsSettingProps {
  unlocked: boolean;
  configured: boolean;
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

export function IntegrationsSetting({
  unlocked,
  configured,
  initialIntegrations,
  integrationStatus,
  integrationError,
}: IntegrationsSettingProps) {
  const router = useRouter();
  const [integrations, setIntegrations] =
    useState<HubIntegration[]>(initialIntegrations);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(integrationError ?? null);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  useEffect(() => {
    if (integrationStatus === "withings_connected") {
      setMessage("Withings connected. Your latest weigh-ins were imported.");
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

  async function handleSync(provider: string) {
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
      };

      if (!response.ok) {
        setError(body.error ?? "Sync failed. Try again.");
        return;
      }

      setMessage(
        `Imported ${body.imported ?? 0} weigh-in${body.imported === 1 ? "" : "s"}${
          body.skipped ? ` (${body.skipped} unchanged)` : ""
        }.`
      );
      await refreshStatuses();
      router.refresh();
    } catch {
      setError("Sync failed. Check your connection and try again.");
    } finally {
      setBusyProvider(null);
    }
  }

  async function handleDisconnect(provider: string) {
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

      {!configured && unlocked && (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
          Withings OAuth is not configured in this environment yet.
        </p>
      )}

      {!unlocked && (
        <div className="mt-4">
          <UpgradePrompt
            title="Pro+ integrations"
            description="Sync weight from Withings and import activity from Fitbit or Strava when those connectors ship."
            suggestedTier="pro_plus"
            href="/profile#subscription"
          />
        </div>
      )}

      {unlocked && (
        <ul className="mt-4 space-y-3">
          {integrations.map((integration) => {
            const lastSync = formatSyncTime(integration.lastSyncAt);
            const isWithings = integration.provider === "withings";
            const connectHref =
              isWithings && integration.available && configured
                ? "/api/integrations/withings/connect"
                : null;

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
                      integration.connected
                        ? "bg-emerald-500/15 text-emerald-300"
                        : integration.available
                          ? "bg-forge-surface-raised text-forge-muted"
                          : "bg-forge-surface-raised text-forge-muted"
                    }`}
                  >
                    {integration.connected
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

                {integration.available && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {integration.connected ? (
                      <>
                        {isWithings && (
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
                        )}
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
                        {isWithings && (
                          <p className="text-[11px] leading-relaxed text-forge-muted">
                            By connecting, you authorize ForgeRep to access weight
                            readings from your Withings account. You can disconnect
                            anytime.{" "}
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
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {message && (
        <p className="mt-3 text-xs font-medium text-emerald-300">{message}</p>
      )}
      {error && (
        <p className="mt-3 text-xs font-medium text-red-300">{error}</p>
      )}
    </section>
  );
}
