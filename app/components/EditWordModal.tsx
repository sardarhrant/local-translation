"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { WordPair } from "@/app/lib/types";

export interface WordEdits {
  textA: string;
  textB: string;
  description: string;
  isIdiom: boolean;
}

interface EditWordModalProps {
  word: WordPair;
  sourceLabel: string;
  targetLabel: string;
  onSave: (id: number, edits: WordEdits) => void;
  onCancel: () => void;
}

const fieldClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500";

export default function EditWordModal({
  word,
  sourceLabel,
  targetLabel,
  onSave,
  onCancel,
}: EditWordModalProps) {
  const [textA, setTextA] = useState(word.textA);
  const [textB, setTextB] = useState(word.textB);
  const [description, setDescription] = useState(word.description);
  const [isIdiom, setIsIdiom] = useState(word.isIdiom);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const a = textA.trim();
    const b = textB.trim();
    if (!a || !b) return;

    onSave(word.id, { textA: a, textB: b, description: description.trim(), isIdiom });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-3 rounded-lg bg-white p-5 shadow-xl dark:bg-zinc-900"
      >
        <h2 className="text-base font-semibold">Edit word</h2>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            {sourceLabel}
          </span>
          <input
            ref={firstFieldRef}
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            className={fieldClassName}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            {targetLabel}
          </span>
          <input
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            className={fieldClassName}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            Description (optional)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Usage notes, an example sentence, context..."
            className={fieldClassName}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={isIdiom}
            onChange={(e) => setIsIdiom(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:border-zinc-700 dark:accent-zinc-50"
          />
          This is an idiom / phrase
        </label>

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!textA.trim() || !textB.trim()}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
