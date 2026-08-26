"use client";

import { useEffect, useState } from "react";
import {
  applyThemeMode,
  loadThemeMode,
  saveThemeMode,
  type ThemeMode,
} from "@/app/lib/theme";

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => loadThemeMode());

  useEffect(() => {
    applyThemeMode(mode);
    saveThemeMode(mode);
  }, [mode]);

  function toggle() {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
    >
      {mode === "dark" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
