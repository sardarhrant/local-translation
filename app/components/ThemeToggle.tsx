"use client";

import { useEffect, useState } from "react";
import {
  applyThemeMode,
  loadThemeMode,
  saveThemeMode,
  type ThemeMode,
} from "@/app/lib/theme";

const MODES: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "☀️ Light" },
  { value: "dark", label: "🌙 Dark" },
  { value: "system", label: "🖥️ System" },
];

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => loadThemeMode());

  useEffect(() => {
    applyThemeMode(mode);
    saveThemeMode(mode);

    if (mode !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange() {
      applyThemeMode("system");
    }
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [mode]);

  function cycleMode() {
    const index = MODES.findIndex((m) => m.value === mode);
    setMode(MODES[(index + 1) % MODES.length].value);
  }

  const current = MODES.find((m) => m.value === mode) ?? MODES[2];

  return (
    <button
      type="button"
      onClick={cycleMode}
      className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
    >
      {current.label}
    </button>
  );
}
