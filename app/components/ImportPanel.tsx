"use client";

import { useState } from "react";
import type { Direction } from "@/app/lib/types";
import { parseImportText } from "@/app/lib/parseImport";

interface ImportPanelProps {
  direction: Direction;
  onImport: (pairs: { en: string; ru: string }[]) => void;
}

export default function ImportPanel({ direction, onImport }: ImportPanelProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(
    null,
  );

  const sourceLabel = direction === "en-ru" ? "English" : "Russian";
  const targetLabel = direction === "en-ru" ? "Russian" : "English";

  function handleImport() {
    const { lines, skipped } = parseImportText(text);
    const pairs = lines.map(({ source, target }) =>
      direction === "en-ru"
        ? { en: source, ru: target }
        : { en: target, ru: source },
    );

    if (pairs.length > 0) onImport(pairs);
    setResult({ added: pairs.length, skipped });
    setText("");
  }

  return (
    <div className="rounded-lg border border-zinc-300 dark:border-zinc-700">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium"
      >
        <span>Bulk import from Google Translate</span>
        <span className="text-zinc-500">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 border-t border-zinc-300 px-4 py-3 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Paste one word pair per line, {sourceLabel} first then{" "}
            {targetLabel}, separated by a tab, comma, semicolon or
            &quot; - &quot;.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={`hello - привет\nworld - мир`}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={!text.trim()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Import
            </button>
            {result && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Added {result.added}
                {result.skipped > 0 ? `, skipped ${result.skipped}` : ""}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
