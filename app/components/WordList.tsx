"use client";

import { getDisplayText, type WordPair } from "@/app/lib/types";
import { getLanguageName } from "@/app/lib/languages";

interface WordListProps {
  words: WordPair[];
  /** A specific language code to display "from", or null to show each row
   * in its own stored order (used for cross-language-pair lists like the
   * starred reminder list, where rows can belong to different pairs). */
  sourceLang: string | null;
  sourceLabel?: string;
  targetLabel?: string;
  revealed: Set<number>;
  onToggleReveal: (id: number) => void;
  onToggleRemind: (word: WordPair) => void;
  onRequestEdit: (word: WordPair) => void;
  onRequestDelete: (word: WordPair) => void;
}

export default function WordList({
  words,
  sourceLang,
  sourceLabel,
  targetLabel,
  revealed,
  onToggleReveal,
  onToggleRemind,
  onRequestEdit,
  onRequestDelete,
}: WordListProps) {
  const crossPair = sourceLang === null;

  if (words.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No words yet. Add one above, or import a backup.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
      <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        <span>{crossPair ? "Word" : sourceLabel}</span>
        <span>{crossPair ? "Translation" : targetLabel}</span>
        <span className="w-5" />
        <span className="w-5" />
        <span className="w-6" />
      </div>
      <ul>
        {words.map((word, index) => {
          const display = getDisplayText(word, sourceLang);
          const isRevealed = revealed.has(word.id);

          return (
            <li
              key={word.id}
              className={`grid grid-cols-[1fr_1fr_auto_auto_auto] items-center px-4 py-2 text-sm ${
                index > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                {display.sourceText}
                {crossPair && (
                  <span className="rounded bg-zinc-100 px-1 py-0.5 text-[10px] font-medium uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {getLanguageName(display.sourceLang)}
                  </span>
                )}
                {word.isIdiom && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    Idiom
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => onToggleReveal(word.id)}
                className="flex w-fit cursor-pointer flex-col items-start gap-0.5 rounded px-1 text-left"
                aria-label={
                  isRevealed ? "Hide translation" : "Show translation"
                }
              >
                <span className="flex items-center gap-2">
                  <span
                    className="transition-[filter] duration-150"
                    style={{ filter: isRevealed ? "none" : "blur(6px)" }}
                  >
                    {display.targetText}
                  </span>
                  {crossPair && (
                    <span className="rounded bg-zinc-100 px-1 py-0.5 text-[10px] font-medium uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {getLanguageName(display.targetLang)}
                    </span>
                  )}
                </span>
                {word.description && (
                  <span
                    className="text-xs text-zinc-500 transition-[filter] duration-150 dark:text-zinc-400"
                    style={{ filter: isRevealed ? "none" : "blur(6px)" }}
                  >
                    {word.description}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onToggleRemind(word)}
                aria-label={
                  word.remindMe
                    ? "Remove from reminder list"
                    : "Add to reminder list"
                }
                aria-pressed={word.remindMe}
                className={`w-5 text-lg leading-none transition-colors ${
                  word.remindMe
                    ? "text-amber-500 hover:text-amber-600"
                    : "text-zinc-300 hover:text-zinc-400 dark:text-zinc-600 dark:hover:text-zinc-500"
                }`}
              >
                {word.remindMe ? "★" : "☆"}
              </button>
              <button
                type="button"
                onClick={() => onRequestEdit(word)}
                aria-label="Edit word"
                className="w-5 text-base leading-none text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✎
              </button>
              <button
                type="button"
                onClick={() => onRequestDelete(word)}
                aria-label="Delete word"
                className="w-6 text-2xl leading-none text-red-500 transition-colors hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
