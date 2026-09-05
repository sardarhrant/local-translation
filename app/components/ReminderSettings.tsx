"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadReminderSettings,
  saveReminderSettings,
  type ReminderSettings,
} from "@/app/lib/reminder";
import type { WordPair } from "@/app/lib/types";

const MAX_CHECK_INTERVAL_MS = 5 * 60 * 1000;

const INTERVAL_OPTIONS = [
  { value: 1, label: "1 minute (testing)" },
  { value: 12 * 60, label: "Every 12 hours" },
  { value: 24 * 60, label: "Once a day" },
  { value: 3 * 24 * 60, label: "Every 3 days" },
  { value: 7 * 24 * 60, label: "Once a week" },
];

function getNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "denied";
  }
  return Notification.permission;
}

function buildReminderBody(names: string[]): string {
  if (names.length === 0) {
    return "Star a few words or phrases in Translations to get reminded about them.";
  }
  if (names.length === 1) {
    return `"${names[0]}" is waiting for practice.`;
  }

  const shown = names.slice(0, 2).map((name) => `"${name}"`);
  const extra = names.length - shown.length;

  return extra > 0
    ? `${shown.join(", ")}, and ${extra} more are waiting for practice.`
    : `${shown.join(" and ")} are waiting for practice.`;
}

function isAppForeground(): boolean {
  return (
    typeof document !== "undefined" &&
    document.visibilityState === "visible" &&
    document.hasFocus()
  );
}

async function showOsNotification(title: string, body: string) {
  try {
    // Once a service worker controls the page (always true for an installed
    // PWA), browsers throw on `new Notification()` and require showing
    // notifications through the service worker registration instead.
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, { body });
      return;
    }

    const notification = new Notification(title, { body });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // A failed/unsupported notification should never take down the app.
  }
}

interface ReminderSettingsPanelProps {
  starredWords: WordPair[];
  onOpenReminderList: () => void;
  onReminderDue: (title: string, body: string) => void;
  /** Drop the own border/rounding when nested inside a shared container. */
  bare?: boolean;
}

export default function ReminderSettingsPanel({
  starredWords,
  onOpenReminderList,
  onReminderDue,
  bare = false,
}: ReminderSettingsPanelProps) {
  const pendingCount = starredWords.length;
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<ReminderSettings>(() =>
    loadReminderSettings(),
  );
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission(),
  );
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!settings.enabled || permission !== "granted") return;

    function maybeNotify() {
      const current = settingsRef.current;
      const dueAt =
        current.lastNotifiedAt + current.intervalMinutes * 60 * 1000;
      if (Date.now() < dueAt) return;

      const title = "Time to review your words";
      const names = starredWords.map((w) => w.textA);
      const body = buildReminderBody(names);

      if (isAppForeground()) {
        onReminderDue(title, body);
      } else {
        void showOsNotification(title, body);
      }

      const next = { ...current, lastNotifiedAt: Date.now() };
      saveReminderSettings(next);
      settingsRef.current = next;
      setSettings(next);
    }

    const pollMs = Math.min(
      MAX_CHECK_INTERVAL_MS,
      settings.intervalMinutes * 60 * 1000,
    );
    const initialCheck = window.setTimeout(maybeNotify, 0);
    const intervalId = window.setInterval(maybeNotify, pollMs);
    return () => {
      window.clearTimeout(initialCheck);
      window.clearInterval(intervalId);
    };
  }, [
    settings.enabled,
    permission,
    starredWords,
    settings.intervalMinutes,
    onReminderDue,
  ]);

  function updateSettings(update: Partial<ReminderSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...update };
      saveReminderSettings(next);
      return next;
    });
  }

  function handleEnable() {
    Notification.requestPermission().then((result) => {
      setPermission(result);
      if (result === "granted") {
        updateSettings({ enabled: true, lastNotifiedAt: Date.now() });
      }
    });
  }

  function handleToggle(checked: boolean) {
    if (checked && permission !== "granted") {
      handleEnable();
      return;
    }
    updateSettings({ enabled: checked });
  }

  const supported = typeof window !== "undefined" && "Notification" in window;

  return (
    <div
      className={
        bare ? "" : "rounded-lg border border-zinc-300 dark:border-zinc-700"
      }
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-base font-medium"
      >
        <span>
          Reminders
          {settings.enabled && permission === "granted" ? " (on)" : ""}
        </span>
        <span className="text-zinc-500">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-zinc-300 px-4 py-3 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {pendingCount > 0
              ? `${pendingCount} word${pendingCount === 1 ? "" : "s"}/phrase${pendingCount === 1 ? "" : "s"} starred for reminders. Star the ☆ next to a word in the list to add or remove it.`
              : "No words starred yet — tap the ☆ next to a word in the list below to add it to your reminders."}
          </p>
          <button
            type="button"
            onClick={onOpenReminderList}
            className="w-fit rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            View reminder list
          </button>

          {!supported ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Notifications aren&apos;t supported in this browser.
            </p>
          ) : permission === "denied" ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Notifications are blocked for this site. Allow them in your
              browser&apos;s site settings to enable reminders.
            </p>
          ) : (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.enabled && permission === "granted"}
                  onChange={(e) => handleToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:border-zinc-700 dark:accent-zinc-50"
                />
                Remind me to practice
              </label>

              {settings.enabled && permission === "granted" && (
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Frequency
                  </span>
                  <select
                    value={settings.intervalMinutes}
                    onChange={(e) =>
                      updateSettings({
                        intervalMinutes: Number(e.target.value),
                      })
                    }
                    className="w-fit rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
                  >
                    {INTERVAL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Reminders only fire while this app is open in a browser tab
                somewhere (it checks every few minutes) — they won&apos;t wake
                up a fully closed browser.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
