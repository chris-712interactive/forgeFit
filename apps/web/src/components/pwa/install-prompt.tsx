"use client";

import { GenericInstallGuide } from "@/components/pwa/generic-install-guide";
import { IosInstallGuide } from "@/components/pwa/ios-install-guide";
import { isStandalonePwa } from "@/lib/pwa/standalone";
import { useEffect, useState } from "react";

const DISMISS_KEY = "forgefit:pwa-install-dismissed";
const FIRST_WORKOUT_KEY = "forgefit:first-workout-complete";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaInstallPromptProps {
  /** Show during onboarding before the first completed workout. */
  showAfterOnboarding?: boolean;
}

function detectIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(ua) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1)
  );
}

export function PwaInstallPrompt({
  showAfterOnboarding = false,
}: PwaInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(showAfterOnboarding);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isStandalonePwa()) {
      setIsStandalone(true);
      return;
    }

    if (
      !showAfterOnboarding &&
      localStorage.getItem(DISMISS_KEY) === "1"
    ) {
      setDismissed(true);
      setActive(false);
      return;
    }

    if (
      !showAfterOnboarding &&
      localStorage.getItem(FIRST_WORKOUT_KEY) !== "1"
    ) {
      setActive(false);
      return;
    }

    setActive(true);
    setIsIos(detectIos());

    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [showAfterOnboarding]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
    setDismissed(true);
    setDeferredPrompt(null);
  }

  if (isStandalone) {
    return null;
  }

  if (!active) {
    return null;
  }

  if (dismissed && !showAfterOnboarding) {
    return null;
  }

  if (dismissed && showAfterOnboarding) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-forge-surface-raised p-4">
        <p className="text-sm text-forge-muted">
          No problem — you can install anytime from Home or Workout.
        </p>
      </section>
    );
  }

  const showInstallButton = !isIos && deferredPrompt != null;

  return (
    <section className="rounded-2xl border border-forge-steel/30 bg-forge-steel/5 p-4">
      <p className="font-display text-sm font-semibold text-forge-text">
        Install ForgeRep
      </p>
      {isIos ? (
        <IosInstallGuide />
      ) : showInstallButton ? (
        <p className="mt-1 text-sm text-forge-muted">
          Tap Install below, or use your browser menu to add ForgeRep to your
          device.
        </p>
      ) : (
        <GenericInstallGuide />
      )}
      <div className={`flex gap-2 ${isIos || !showInstallButton ? "mt-4" : "mt-3"}`}>
        {showInstallButton && (
          <button
            type="button"
            onClick={() => void install()}
            className="rounded-lg bg-forge-ember px-4 py-2 text-sm font-semibold text-white"
          >
            Install
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className={`rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted ${
            isIos || !showInstallButton ? "w-full" : ""
          }`}
        >
          {isIos || !showInstallButton ? "Got it — maybe later" : "Not now"}
        </button>
      </div>
    </section>
  );
}

export function markFirstWorkoutComplete() {
  if (typeof window === "undefined") return;
  localStorage.setItem(FIRST_WORKOUT_KEY, "1");
}
