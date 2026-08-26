"use client";

import { useEffect } from "react";
import type { WordPair } from "@/app/lib/types";
import WordList from "./WordList";

interface ReminderListModalProps {
  words: WordPair[];
  revealed: Set<number>;
  onToggleReveal: (id: number) => void;
  onToggleRemind: (word: WordPair) => void;
  onRequestEdit: (word: WordPair) => void;
  onRequestDelete: (word: WordPair) => void;
  onClose: () => void;
}

export default function ReminderListModal({
  words,
  revealed,
  onToggleReveal,
  onToggleRemind,
  onRequestEdit,
  onRequestDelete,
  onClose,
}: ReminderListModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-list-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-full w-full max-w-2xl flex-col gap-4 overflow-hidden rounded-lg bg-white p-5 shadow-xl dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between">
          <h2 id="reminder-list-title" className="text-base font-semibold">
            Reminder list
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-xl leading-none text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto">
          {words.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No words or phrases starred yet. Star the ☆ next to a word in
              the list to add it here.
            </p>
          ) : (
            <WordList
              words={words}
              sourceLang={null}
              revealed={revealed}
              onToggleReveal={onToggleReveal}
              onToggleRemind={onToggleRemind}
              onRequestEdit={onRequestEdit}
              onRequestDelete={onRequestDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
