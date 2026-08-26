export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "translations:theme";

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function loadThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Ignore read failures (e.g. private browsing storage limits).
  }
  return systemPrefersDark() ? "dark" : "light";
}

export function saveThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Ignore write failures.
  }
}

export function applyThemeMode(mode: ThemeMode): void {
  document.documentElement.classList.toggle("dark", mode === "dark");
}
