export interface ReminderSettings {
  enabled: boolean;
  intervalMinutes: number;
  lastNotifiedAt: number;
}

const STORAGE_KEY = "translations:reminder";

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  intervalMinutes: 24 * 60,
  lastNotifiedAt: 0,
};

export function loadReminderSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_REMINDER_SETTINGS;
    return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export function saveReminderSettings(settings: ReminderSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
