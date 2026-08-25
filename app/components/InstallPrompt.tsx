"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as { standalone?: boolean })
    .standalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosStandalone === true
  );
}

function getIsIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone] = useState(getIsStandalone);
  const [isIOS] = useState(getIsIOS);
  const [iosHintDismissed, setIosHintDismissed] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    function handleAppInstalled() {
      setDeferredPrompt(null);
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener,
    );
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (isStandalone) return null;

  if (deferredPrompt) {
    return (
      <button
        type="button"
        onClick={handleInstallClick}
        className="w-fit rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        Install app
      </button>
    );
  }

  if (isIOS && !iosHintDismissed) {
    return (
      <div className="flex w-fit items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        <span>Install: tap Share, then &quot;Add to Home Screen&quot;.</span>
        <button
          type="button"
          onClick={() => setIosHintDismissed(true)}
          aria-label="Dismiss"
          className="text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          ×
        </button>
      </div>
    );
  }

  return null;
}
