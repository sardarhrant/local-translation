"use client";

import { LANGUAGES } from "@/app/lib/languages";

interface LanguagePairSelectorProps {
  sourceLang: string;
  targetLang: string;
  onChangeSource: (lang: string) => void;
  onChangeTarget: (lang: string) => void;
  onSwap: () => void;
}

const selectClassName =
  "min-w-[9.5rem] rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium outline-none transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800";

export default function LanguagePairSelector({
  sourceLang,
  targetLang,
  onChangeSource,
  onChangeTarget,
  onSwap,
}: LanguagePairSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={sourceLang}
        onChange={(e) => onChangeSource(e.target.value)}
        aria-label="From language"
        className={selectClassName}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onSwap}
        aria-label="Swap languages"
        className="rounded-full border border-zinc-300 px-3 py-2.5 text-base transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        ⇄
      </button>
      <select
        value={targetLang}
        onChange={(e) => onChangeTarget(e.target.value)}
        aria-label="To language"
        className={selectClassName}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
