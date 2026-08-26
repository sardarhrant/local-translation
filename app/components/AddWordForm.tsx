"use client";

import { useState, type FormEvent } from "react";
import { CEFR_LEVELS } from "@/app/lib/levels";

export interface NewWordInput {
  sourceText: string;
  targetText: string;
  description: string;
  level: string;
  isIdiom: boolean;
}

interface AddWordFormProps {
  sourceLabel: string;
  targetLabel: string;
  onAdd: (input: NewWordInput) => void;
}

const fieldClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500";

export default function AddWordForm({
  sourceLabel,
  targetLabel,
  onAdd,
}: AddWordFormProps) {
  const [open, setOpen] = useState(false);
  const [sourceValue, setSourceValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("");
  const [isIdiom, setIsIdiom] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const source = sourceValue.trim();
    const target = targetValue.trim();
    if (!source || !target) return;

    onAdd({
      sourceText: source,
      targetText: target,
      description: description.trim(),
      level,
      isIdiom,
    });

    setSourceValue("");
    setTargetValue("");
    setDescription("");
    setLevel("");
    setIsIdiom(false);
  }

  return (
    <div className="rounded-lg border border-zinc-300 dark:border-zinc-700">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium"
      >
        <span>Add word</span>
        <span className="text-zinc-500">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 border-t border-zinc-300 px-4 py-3 dark:border-zinc-700"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                {sourceLabel}
              </span>
              <input
                value={sourceValue}
                onChange={(e) => setSourceValue(e.target.value)}
                placeholder={`Word in ${sourceLabel}`}
                className={fieldClassName}
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
                className={fieldClassName}
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
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              Description (optional)
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Usage notes, an example sentence, context..."
              className={fieldClassName}
            />
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Level</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
              >
                <option value="">No level</option>
                {CEFR_LEVELS.map((cefrLevel) => (
                  <option key={cefrLevel} value={cefrLevel}>
                    {cefrLevel}
                  </option>
                ))}
              </select>
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
          </div>
        </form>
      )}
    </div>
  );
}
