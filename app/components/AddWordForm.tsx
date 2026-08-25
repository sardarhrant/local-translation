"use client";

import { useState, type FormEvent } from "react";
import type { Direction } from "@/app/lib/types";

interface AddWordFormProps {
  direction: Direction;
  onAdd: (en: string, ru: string, isIdiom: boolean) => void;
}

export default function AddWordForm({ direction, onAdd }: AddWordFormProps) {
  const [sourceValue, setSourceValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [isIdiom, setIsIdiom] = useState(false);

  const sourceLabel = direction === "en-ru" ? "English" : "Russian";
  const targetLabel = direction === "en-ru" ? "Russian" : "English";

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const source = sourceValue.trim();
    const target = targetValue.trim();
    if (!source || !target) return;

    if (direction === "en-ru") {
      onAdd(source, target, isIdiom);
    } else {
      onAdd(target, source, isIdiom);
    }

    setSourceValue("");
    setTargetValue("");
    setIsIdiom(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            {sourceLabel}
          </span>
          <input
            value={sourceValue}
            onChange={(e) => setSourceValue(e.target.value)}
            placeholder={`Word in ${sourceLabel}`}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            {targetLabel}
          </span>
          <input
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder={`Translation in ${targetLabel}`}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
          />
        </label>
        <button
          type="submit"
          disabled={!sourceValue.trim() || !targetValue.trim()}
          className="h-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Add word
        </button>
      </div>
      <label className="flex w-fit items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <input
          type="checkbox"
          checked={isIdiom}
          onChange={(e) => setIsIdiom(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:border-zinc-700 dark:accent-zinc-50"
        />
        This is an idiom / phrase
      </label>
    </form>
  );
}
