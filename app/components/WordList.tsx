"use client";

import type { Direction, WordPair } from "@/app/lib/types";

interface WordListProps {
  words: WordPair[];
  direction: Direction;
  revealed: Set<number>;
  onToggleReveal: (id: number) => void;
  onToggleRemind: (word: WordPair) => void;
  onRequestDelete: (word: WordPair) => void;
}

export default function WordList({
  words,
  direction,
  revealed,
  onToggleReveal,
  onToggleRemind,
  onRequestDelete,
}: WordListProps) {
  const sourceLabel = direction === "en-ru" ? "English" : "Russian";
  const targetLabel = direction === "en-ru" ? "Russian" : "English";

  if (words.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No words yet. Add one above, or bulk import your list.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
      <div className="grid grid-cols-[1fr_1fr_auto_auto] bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        <span>{sourceLabel}</span>
        <span>{targetLabel}</span>
        <span className="w-6" />
        <span className="w-8" />
      </div>
      <ul>
        {words.map((word, index) => {
          const source = direction === "en-ru" ? word.en : word.ru;
          const target = direction === "en-ru" ? word.ru : word.en;
          const isRevealed = revealed.has(word.id);

          return (
            <li
              key={word.id}
              className={`grid grid-cols-[1fr_1fr_auto_auto] items-center px-4 py-2 text-sm ${
                index > 0 ? "border-t border-zinc-200 dark:border-zinc-800" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                {source}
                {word.isIdiom && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    Idiom
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => onToggleReveal(word.id)}
                className="w-fit cursor-pointer rounded px-1 text-left transition-[filter] duration-150"
                style={{ filter: isRevealed ? "none" : "blur(6px)" }}
                aria-label={isRevealed ? "Hide translation" : "Show translation"}
              >
                {target}
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
                className={`w-6 text-lg leading-none transition-colors ${
                  word.remindMe
                    ? "text-amber-500 hover:text-amber-600"
                    : "text-zinc-300 hover:text-zinc-400 dark:text-zinc-600 dark:hover:text-zinc-500"
                }`}
              >
                {word.remindMe ? "★" : "☆"}
              </button>
              <button
                type="button"
                onClick={() => onRequestDelete(word)}
                aria-label="Delete word"
                className="w-8 text-2xl leading-none text-red-500 transition-colors hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
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
