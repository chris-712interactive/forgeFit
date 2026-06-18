"use client";

import { saveCommunityPushPreferences } from "@/app/actions/community-push";
import type { CommunityPushSettings } from "@/lib/coaching/community-push";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CommunityPushSettingProps {
  enabled: boolean;
  push: CommunityPushSettings;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function CommunityPushSetting({ enabled, push }: CommunityPushSettingProps) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(push.subscribed);
  const [preferences, setPreferences] = useState(push.preferences);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enabled || !push.configured) {
    if (!enabled) {
      return null;
    }

    return (
      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Community push
        </h2>
        <p className="mt-2 text-xs text-forge-muted">
          Push notifications are not configured on this environment yet.
        </p>
      </section>
    );
  }

  async function registerPush() {
    setBusy(true);
    setError(null);

    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setError("Push is not supported in this browser.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission denied.");
        return;
      }

      const keyResponse = await fetch("/api/community/push/vapid-key");
      if (!keyResponse.ok) {
        setError("Could not load push configuration.");
        return;
      }

      const { publicKey } = (await keyResponse.json()) as { publicKey: string };
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = subscription.toJSON();
      const saveResponse = await fetch("/api/community/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      if (!saveResponse.ok) {
        const payload = (await saveResponse.json()) as { error?: string };
        setError(payload.error ?? "Could not save push subscription.");
        await subscription.unsubscribe();
        return;
      }

      setSubscribed(true);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not enable push notifications."
      );
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    setBusy(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/community/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setSubscribed(false);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not disable push notifications."
      );
    } finally {
      setBusy(false);
    }
  }

  async function togglePreference(
    key: keyof typeof preferences,
    next: boolean
  ) {
    const updated = { ...preferences, [key]: next };
    setPreferences(updated);
    setBusy(true);
    setError(null);

    const result = await saveCommunityPushPreferences({ [key]: next });
    setBusy(false);

    if (!result.ok) {
      setPreferences(preferences);
      setError(result.error ?? "Could not save preference.");
      return;
    }

    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Community push
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Get notified when rivals pass you, you receive cheers, or the week is
        almost over.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!subscribed ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void registerPush()}
            className="rounded-xl bg-forge-ember px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Enable push notifications
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void disablePush()}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-text disabled:opacity-50"
          >
            Disable push
          </button>
        )}
        {subscribed && (
          <span className="text-xs font-medium text-forge-gold">Push enabled</span>
        )}
      </div>

      {subscribed && (
        <ul className="mt-4 space-y-3">
          <PreferenceToggle
            label="Someone passes you"
            checked={preferences.rankPassed}
            disabled={busy}
            onChange={(next) => void togglePreference("rankPassed", next)}
          />
          <PreferenceToggle
            label="Close to passing someone"
            checked={preferences.closeToPass}
            disabled={busy}
            onChange={(next) => void togglePreference("closeToPass", next)}
          />
          <PreferenceToggle
            label="Rival matchup updates"
            checked={preferences.rivalEvents}
            disabled={busy}
            onChange={(next) => void togglePreference("rivalEvents", next)}
          />
          <PreferenceToggle
            label="Cheers on your wins"
            checked={preferences.cheerReceived}
            disabled={busy}
            onChange={(next) => void togglePreference("cheerReceived", next)}
          />
          <PreferenceToggle
            label="New training friends"
            checked={preferences.followMutual}
            disabled={busy}
            onChange={(next) => void togglePreference("followMutual", next)}
          />
          <PreferenceToggle
            label="Sunday final-hours nudge"
            checked={preferences.sundayNudge}
            disabled={busy}
            onChange={(next) => void togglePreference("sundayNudge", next)}
          />
        </ul>
      )}

      {error && <p className="mt-3 text-xs text-forge-coral">{error}</p>}
    </section>
  );
}

function PreferenceToggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4">
      <span className="text-sm text-forge-text">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-forge-ember" : "bg-forge-muted/40"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </li>
  );
}
