"use client";

import { memo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getDisplayText, type WordPair } from "@/app/lib/types";
import { getLanguageName } from "@/app/lib/languages";
import RowActionsMenu from "./RowActionsMenu";

const ROW_GRID = "grid grid-cols-[1fr_auto_auto_auto] gap-x-3";

function ArrowIcon({ revealed }: { revealed: boolean }) {
  return (
    <svg
      className="h-6 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* upper arrow points right ("see the translation") */}
      <g className={revealed ? "opacity-40" : "opacity-100"}>
        <path d="M3 6h15" />
        <path d="M15 2l4 4-4 4" />
      </g>
      {/* lower arrow points left ("back to the original") */}
      <g className={revealed ? "opacity-100" : "opacity-40"}>
        <path d="M21 18H6" />
        <path d="M9 14l-4 4 4 4" />
      </g>
    </svg>
  );
}

/** Direction toggle sitting before the star. It stays visible at all times;
 * a click flips the row's word cell between the original text (◀) and its
 * translation (▶). */
function DirectionToggle({
  revealed,
  onToggle,
}: {
  revealed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={revealed ? "Show original" : "Show translation"}
      aria-pressed={revealed}
      className={`flex w-9 cursor-pointer items-center justify-center transition-colors ${
        revealed
          ? "text-blue-500 hover:text-blue-600"
          : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
      }`}
    >
      <ArrowIcon revealed={revealed} />
    </button>
  );
}

interface WordRowProps {
  word: WordPair;
  sourceLang: string | null;
  crossPair: boolean;
  isRevealed: boolean;
  onToggleReveal: (id: number) => void;
  onToggleRemind: (word: WordPair) => void;
  onRequestEdit: (word: WordPair) => void;
  onRequestDelete: (word: WordPair) => void;
}

const WordRow = memo(function WordRow({
  word,
  sourceLang,
  crossPair,
  isRevealed,
  onToggleReveal,
  onToggleRemind,
  onRequestEdit,
  onRequestDelete,
}: WordRowProps) {
  const display = getDisplayText(word, sourceLang);

  return (
    <>
      {word.level && (
        <span className="absolute left-1 top-1 rounded bg-blue-100 px-1 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          {word.level}
        </span>
      )}
      <span className="flex flex-wrap items-start gap-2 text-[17px]">
        <span
          className={
            isRevealed ? "text-blue-600 dark:text-blue-400" : undefined
          }
        >
          {isRevealed ? display.targetText : display.sourceText}
        </span>
        {crossPair && (
          <span className="rounded bg-zinc-100 px-1 py-0.5 text-[10px] font-medium uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {getLanguageName(
              isRevealed ? display.targetLang : display.sourceLang,
            )}
          </span>
        )}
        {word.isIdiom && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            Idiom
          </span>
        )}
      </span>
      <DirectionToggle
        revealed={isRevealed}
        onToggle={() => onToggleReveal(word.id)}
      />
      <button
        type="button"
        onClick={() => onToggleRemind(word)}
        aria-label={
          word.remindMe ? "Remove from reminder list" : "Add to reminder list"
        }
        aria-pressed={word.remindMe}
        className={`w-7 text-2xl leading-none transition-colors ${
          word.remindMe
            ? "text-amber-500 hover:text-amber-600"
            : "text-zinc-300 hover:text-zinc-400 dark:text-zinc-600 dark:hover:text-zinc-500"
        }`}
      >
        {word.remindMe ? "★" : "☆"}
      </button>
      <RowActionsMenu
        onEdit={() => onRequestEdit(word)}
        onDelete={() => onRequestDelete(word)}
      />
      {word.description && isRevealed && (
        <p className="col-span-full mt-1 w-fit rounded-[4px] border border-zinc-200 px-2 py-1 text-[14px] leading-snug text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {word.description}
        </p>
      )}
    </>
  );
});

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
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: words.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 68,
    overscan: 8,
    // Key measurements by the word's own id, not its array index. Search,
    // filtering, and imports reorder the underlying array; without this,
    // a row can reuse another row's stale cached height from a previous
    // index, which misplaces it and overlaps the next row.
    getItemKey: (index) => words[index].id,
  });

  if (words.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No words yet. Add one above, or import a backup.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
      <div
        className={`${ROW_GRID} bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400`}
      >
        <span>
          {crossPair ? "Word" : sourceLabel}
          <span className="text-zinc-400 dark:text-zinc-500">
            {" / "}
            {crossPair ? "Translation" : targetLabel}
          </span>
        </span>
        <span className="w-9" />
        <span className="w-7" />
        <span className="w-6" />
      </div>
      <div ref={parentRef} className="max-h-[36rem] overflow-y-auto">
        <ul
          style={{ height: virtualizer.getTotalSize(), position: "relative" }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const index = virtualRow.index;
            const word = words[index];

            return (
              <li
                key={word.id}
                data-index={index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={`${ROW_GRID} items-start px-4 py-2 text-sm ${
                  index > 0
                    ? "border-t border-zinc-200 dark:border-zinc-800"
                    : ""
                } ${word.level ? "pt-6" : ""}`}
              >
                <WordRow
                  word={word}
                  sourceLang={sourceLang}
                  crossPair={crossPair}
                  isRevealed={revealed.has(word.id)}
                  onToggleReveal={onToggleReveal}
                  onToggleRemind={onToggleRemind}
                  onRequestEdit={onRequestEdit}
                  onRequestDelete={onRequestDelete}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
