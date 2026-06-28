"use client";

import { saveWeighInPushPreference } from "@/app/actions/weigh-in-push";
import type { WeighInPushSettings } from "@/lib/coaching/progress-push";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface WeighInPushSettingProps {
  push: WeighInPushSettings;
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

export function WeighInPushSetting({ push }: WeighInPushSettingProps) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(push.subscribed);
  const [weeklyNudge, setWeeklyNudge] = useState(push.weeklyWeighInNudge);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!push.configured) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
          Weekly weigh-in reminders
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

      const keyResponse = await fetch("/api/push/vapid-key");
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
      const saveResponse = await fetch("/api/push/subscribe", {
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
        await fetch("/api/push/subscribe", {
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

  async function toggleWeeklyNudge(next: boolean) {
    setWeeklyNudge(next);
    setBusy(true);
    setError(null);

    const result = await saveWeighInPushPreference(next);
    setBusy(false);

    if (!result.ok) {
      setWeeklyNudge(!next);
      setError(result.error ?? "Could not save preference.");
      return;
    }

    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4 sm:p-5">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-forge-muted">
        Weekly weigh-in reminders
      </h2>
      <p className="mt-1 text-xs text-forge-muted">
        Optional Sunday push when it has been a week since your last weigh-in.
        In-app banners still appear on Home and Progress.
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
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm text-forge-text">Sunday weigh-in nudge</span>
          <button
            type="button"
            role="switch"
            aria-checked={weeklyNudge}
            disabled={busy}
            onClick={() => void toggleWeeklyNudge(!weeklyNudge)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              weeklyNudge ? "bg-forge-ember" : "bg-forge-muted/40"
            } ${busy ? "opacity-60" : ""}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                weeklyNudge ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-forge-coral">{error}</p>}
    </section>
  );
}
