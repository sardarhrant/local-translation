"use client";

import { memo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getDisplayText, type WordPair } from "@/app/lib/types";
import { getLanguageName } from "@/app/lib/languages";
import PronunciationModal from "./PronunciationModal";
import RowActionsMenu from "./RowActionsMenu";

const ROW_GRID = "grid grid-cols-[1fr_auto_auto_auto] gap-x-3";

function FullscreenIcon({ exit }: { exit: boolean }) {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {exit ? (
        <>
          <path d="M8 3v3a2 2 0 0 1-2 2H3" />
          <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
          <path d="M3 16h3a2 2 0 0 1 2 2v3" />
          <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
        </>
      ) : (
        <>
          <path d="M8 3H5a2 2 0 0 0-2 2v3" />
          <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
          <path d="M3 16v3a2 2 0 0 0 2 2h3" />
          <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </>
      )}
    </svg>
  );
}

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

/** A row shown while the list is in multi-select mode. */
function SelectableRow({
  word,
  sourceLang,
  crossPair,
  selected,
  onToggle,
}: {
  word: WordPair;
  sourceLang: string | null;
  crossPair: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const display = getDisplayText(word, sourceLang);
  return (
    <label className="flex w-full cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="h-4 w-4 shrink-0 rounded border-zinc-300 accent-zinc-900 dark:border-zinc-700 dark:accent-zinc-50"
      />
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
        <span>{display.sourceText}</span>
        <span className="text-zinc-400 dark:text-zinc-500">→</span>
        <span>{display.targetText}</span>
        {crossPair && (
          <span className="rounded bg-zinc-100 px-1 py-0.5 text-[10px] font-medium uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {getLanguageName(display.sourceLang)}–{getLanguageName(display.targetLang)}
          </span>
        )}
      </span>
    </label>
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
  onStartSelect?: (id: number) => void;
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
  onStartSelect,
}: WordRowProps) {
  const display = getDisplayText(word, sourceLang);
  const [practiceOpen, setPracticeOpen] = useState(false);

  const shownText = isRevealed ? display.targetText : display.sourceText;
  const shownLang = isRevealed ? display.targetLang : display.sourceLang;

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
          {shownText}
        </span>
        {crossPair && (
          <span className="rounded bg-zinc-100 px-1 py-0.5 text-[10px] font-medium uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {getLanguageName(shownLang)}
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
        onPractice={() => setPracticeOpen(true)}
        onSelect={
          onStartSelect ? () => onStartSelect(word.id) : undefined
        }
      />
      {word.description && isRevealed && (
        <p className="col-span-full mt-1 w-fit rounded-[4px] border border-zinc-200 px-2 py-1 text-[14px] leading-snug text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {word.description}
        </p>
      )}
      {practiceOpen && (
        <PronunciationModal
          word={word}
          onClose={() => setPracticeOpen(false)}
        />
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
  /** Full-screen mode: the list occupies a full 100dvh (header row + scroll
   * area) instead of capping at the default max height. */
  fill?: boolean;
  /** When provided, a toggle appears next to the column labels to enter /
   * leave full-screen mode. */
  onToggleFill?: () => void;
  /** When provided, the row menu offers "Select" to enter multi-select. */
  onStartSelect?: (id: number) => void;
  /** Present only while in multi-select mode. */
  selection?: {
    selectedIds: Set<number>;
    onToggle: (id: number) => void;
    onSelectAll: () => void;
    onClear: () => void;
    onExit: () => void;
    onExport: () => void;
    onDelete: () => void;
  };
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
  fill = false,
  onToggleFill,
  onStartSelect,
  selection,
  onToggleReveal,
  onToggleRemind,
  onRequestEdit,
  onRequestDelete,
}: WordListProps) {
  const crossPair = sourceLang === null;
  const selectMode = !!selection;
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
    <div
      className={`overflow-hidden ${
        fill
          ? "flex h-[100dvh] flex-col border-b border-zinc-300 dark:border-zinc-700"
          : "rounded-lg border border-zinc-300 dark:border-zinc-700"
      }`}
    >
      <div
        className={`${selectMode ? "flex" : ROW_GRID} ${
          fill ? "shrink-0" : ""
        } items-center bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400`}
      >
        {selection ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span>{selection.selectedIds.size} selected</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={
                  selection.selectedIds.size === words.length
                    ? selection.onClear
                    : selection.onSelectAll
                }
                className="rounded px-2 py-1 font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                {selection.selectedIds.size === words.length ? "None" : "All"}
              </button>
              <button
                type="button"
                onClick={selection.onExport}
                disabled={selection.selectedIds.size === 0}
                className="rounded px-2 py-1 font-medium transition-colors hover:bg-zinc-200 disabled:opacity-40 dark:hover:bg-zinc-800"
              >
                Export
              </button>
              <button
                type="button"
                onClick={selection.onDelete}
                disabled={selection.selectedIds.size === 0}
                className="rounded px-2 py-1 font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={selection.onExit}
                className="rounded px-2 py-1 font-medium transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <span>
              {crossPair ? "Word" : sourceLabel}
              <span className="text-zinc-400 dark:text-zinc-500">
                {" / "}
                {crossPair ? "Translation" : targetLabel}
              </span>
            </span>
            <span className="w-9" />
            <span className="w-7" />
            {onToggleFill ? (
              <button
                type="button"
                onClick={onToggleFill}
                aria-label={fill ? "Exit full screen" : "Full screen list"}
                className="flex h-5 w-5 items-center justify-center justify-self-end rounded-full border border-zinc-300 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
              >
                <FullscreenIcon exit={fill} />
              </button>
            ) : (
              <span className="w-6" />
            )}
          </>
        )}
      </div>
      <div
        ref={parentRef}
        className={`overflow-y-auto ${
          fill ? "min-h-0 flex-1" : "max-h-[36rem]"
        }`}
      >
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
                className={
                  selectMode
                    ? `flex items-center px-4 py-2.5 text-sm ${
                        index > 0
                          ? "border-t border-zinc-200 dark:border-zinc-800"
                          : ""
                      }`
                    : `${ROW_GRID} items-start px-4 py-2 text-sm ${
                        index > 0
                          ? "border-t border-zinc-200 dark:border-zinc-800"
                          : ""
                      } ${word.level ? "pt-6" : ""}`
                }
              >
                {selection ? (
                  <SelectableRow
                    word={word}
                    sourceLang={sourceLang}
                    crossPair={crossPair}
                    selected={selection.selectedIds.has(word.id)}
                    onToggle={() => selection.onToggle(word.id)}
                  />
                ) : (
                  <WordRow
                    word={word}
                    sourceLang={sourceLang}
                    crossPair={crossPair}
                    isRevealed={revealed.has(word.id)}
                    onToggleReveal={onToggleReveal}
                    onToggleRemind={onToggleRemind}
                    onRequestEdit={onRequestEdit}
                    onRequestDelete={onRequestDelete}
                    onStartSelect={onStartSelect}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
