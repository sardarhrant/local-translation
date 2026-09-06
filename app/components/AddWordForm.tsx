"use client";

import { useState, type FormEvent } from "react";
import { CEFR_LEVELS } from "@/app/lib/levels";
import { translate } from "@/app/lib/translate";

export interface NewWordInput {
  sourceText: string;
  targetText: string;
  description: string;
  level: string;
  isIdiom: boolean;
}

interface AddWordFormProps {
  sourceLang: string;
  targetLang: string;
  sourceLabel: string;
  targetLabel: string;
  onAdd: (input: NewWordInput) => void;
}

const fieldClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500";

export default function AddWordForm({
  sourceLang,
  targetLang,
  sourceLabel,
  targetLabel,
  onAdd,
}: AddWordFormProps) {
  const [sourceValue, setSourceValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("");
  const [isIdiom, setIsIdiom] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const source = sourceValue.trim();
  const target = targetValue.trim();
  // Enabled whenever either field has text; translates forward from the
  // source, or reverse when only the target is filled.
  const canTranslate = !translating && (!!source || !!target);

  async function handleTranslate() {
    setTranslateError(null);
    const reverse = !source && !!target;
    setTranslating(true);
    try {
      const result = reverse
        ? await translate(target, targetLang, sourceLang)
        : await translate(source, sourceLang, targetLang);
      if (reverse) setSourceValue(result);
      else setTargetValue(result);
    } catch (err) {
      setTranslateError(
        err instanceof Error ? err.message : "Translation failed",
      );
    } finally {
      setTranslating(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
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
    setTranslateError(null);
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
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTranslate}
          disabled={!canTranslate}
          className="w-fit rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {translating ? "Translating…" : "⇄ Translate"}
        </button>
        {translateError && (
          <span className="text-xs text-red-600 dark:text-red-400">
            {translateError}
          </span>
        )}
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
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          aria-label="Level"
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
        >
          <option value="">No level</option>
          {CEFR_LEVELS.map((cefrLevel) => (
            <option key={cefrLevel} value={cefrLevel}>
              {cefrLevel}
            </option>
          ))}
        </select>
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
      <button
        type="submit"
        disabled={!source || !target}
        className="w-fit rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Add word
      </button>
    </form>
  );
}
