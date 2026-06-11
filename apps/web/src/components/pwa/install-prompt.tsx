"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "forgefit:pwa-install-dismissed";
const FIRST_WORKOUT_KEY = "forgefit:first-workout-complete";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (localStorage.getItem(FIRST_WORKOUT_KEY) !== "1") return;

    const ua = window.navigator.userAgent.toLowerCase();
    const ios =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === "MacIntel" &&
        window.navigator.maxTouchPoints > 1);
    setIsIos(ios);

    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (ios) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
    setVisible(false);
    setDeferredPrompt(null);
  }

  if (!visible) return null;

  return (
    <section className="rounded-2xl border border-forge-steel/30 bg-forge-steel/5 p-4">
      <p className="font-display text-sm font-semibold text-forge-text">
        Install forgeFit
      </p>
      <p className="mt-1 text-sm text-forge-muted">
        {isIos
          ? "Add forgeFit to your Home Screen for faster access and a better offline workout experience (Share → Add to Home Screen)."
          : "Install the app on your device for faster access and reliable offline logging."}
      </p>
      <div className="mt-3 flex gap-2">
        {!isIos && deferredPrompt && (
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
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-forge-muted"
        >
          Not now
        </button>
      </div>
    </section>
  );
}

export function markFirstWorkoutComplete() {
  if (typeof window === "undefined") return;
  localStorage.setItem(FIRST_WORKOUT_KEY, "1");
}
