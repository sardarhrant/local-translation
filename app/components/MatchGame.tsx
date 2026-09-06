"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getDisplayText, type WordPair } from "@/app/lib/types";
import { shuffle } from "@/app/lib/shuffle";

const ROUND_SIZE = 5;
const TAP_MOVE_THRESHOLD = 6;

interface MatchGameProps {
  words: WordPair[];
  sourceLang: string;
  onClose: () => void;
}

interface DragState {
  cardId: number;
  fromIndex: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  moved: boolean;
}

function pickRound(pool: WordPair[]): WordPair[] {
  return shuffle(pool).slice(0, Math.min(ROUND_SIZE, pool.length));
}

/** A shuffled id order that isn't already fully solved (when avoidable). */
function scrambleOrder(roundWords: WordPair[]): number[] {
  const solved = roundWords.map((w) => w.id);
  if (roundWords.length < 2) return solved;
  for (let attempt = 0; attempt < 20; attempt++) {
    const next = shuffle(solved);
    if (next.some((id, i) => id !== solved[i])) return next;
  }
  return solved;
}

function swap(order: number[], a: number, b: number): number[] {
  if (a === b) return order;
  const next = order.slice();
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

export default function MatchGame({ words, sourceLang, onClose }: MatchGameProps) {
  const [roundWords, setRoundWords] = useState<WordPair[]>(() => pickRound(words));
  const [order, setOrder] = useState<number[]>(() => scrambleOrder(roundWords));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const displayById = useMemo(() => {
    const map = new Map<number, { sourceText: string; targetText: string }>();
    for (const word of roundWords) {
      const display = getDisplayText(word, sourceLang);
      map.set(word.id, {
        sourceText: display.sourceText,
        targetText: display.targetText,
      });
    }
    return map;
  }, [roundWords, sourceLang]);

  const allCorrect =
    roundWords.length > 0 &&
    roundWords.every((word, index) => order[index] === word.id);

  function restart() {
    const next = pickRound(words);
    setRoundWords(next);
    setOrder(scrambleOrder(next));
    setSelectedIndex(null);
  }

  function moveCard(from: number, to: number) {
    setOrder((prev) => swap(prev, from, to));
  }

  function handleRowTap(index: number) {
    if (selectedIndex === null) {
      setSelectedIndex(index);
      return;
    }
    if (selectedIndex !== index) moveCard(selectedIndex, index);
    setSelectedIndex(null);
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLElement>,
    cardId: number,
    fromIndex: number,
  ) {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    const state: DragState = {
      cardId,
      fromIndex,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
    dragRef.current = state;
    setDrag(state);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const current = dragRef.current;
    if (!current) return;
    const distance = Math.hypot(
      event.clientX - current.startX,
      event.clientY - current.startY,
    );
    const next: DragState = {
      ...current,
      x: event.clientX,
      y: event.clientY,
      moved: current.moved || distance > TAP_MOVE_THRESHOLD,
    };
    dragRef.current = next;
    setDrag(next);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
    const current = dragRef.current;
    dragRef.current = null;
    if (!current) return;
    setDrag(null);

    if (!current.moved) {
      handleRowTap(current.fromIndex);
      return;
    }

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const rowEl =
      target instanceof Element ? target.closest("[data-row-index]") : null;
    const toIndex = rowEl
      ? Number(rowEl.getAttribute("data-row-index"))
      : NaN;

    if (!Number.isNaN(toIndex)) moveCard(current.fromIndex, toIndex);
  }

  function renderCard(cardId: number, index: number, correct: boolean) {
    const isDragging = drag?.cardId === cardId;
    const isSelected = selectedIndex === index;
    const text = displayById.get(cardId)?.targetText ?? "";

    return (
      <div
        onPointerDown={(e) => handlePointerDown(e, cardId, index)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={
          isDragging
            ? {
                position: "fixed",
                left: drag.x - drag.offsetX,
                top: drag.y - drag.offsetY,
                zIndex: 60,
                pointerEvents: "none",
                touchAction: "none",
                width: 160,
              }
            : { touchAction: "none" }
        }
        className={`flex-1 cursor-grab select-none rounded-lg border px-3 py-2 text-sm shadow-sm active:cursor-grabbing ${
          correct
            ? "border-green-400 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300"
            : isSelected
              ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
              : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        }`}
      >
        {text}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-game-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-2xl flex-col gap-4 overflow-hidden rounded-lg bg-white p-5 shadow-xl dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between">
          <h2 id="match-game-title" className="text-base font-semibold">
            Practice: line up the translations
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

        {roundWords.length < 2 ? (
          <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Add at least 2 words in this language pair to practice matching.
          </p>
        ) : (
          <>
            {allCorrect && (
              <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300">
                <span className="text-xl">✅</span>
                <span>All {roundWords.length} lined up correctly! Nice work.</span>
              </div>
            )}

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Drag each translation up or down until it sits next to its word
              (or tap two rows to swap them).
            </p>

            <div className="flex flex-col gap-2 overflow-y-auto">
              {roundWords.map((word, index) => {
                const cardId = order[index];
                const correct = cardId === word.id;

                return (
                  <div
                    key={word.id}
                    data-row-index={index}
                    className="flex items-stretch gap-3"
                  >
                    <div className="flex flex-1 items-center rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                      {displayById.get(word.id)?.sourceText}
                    </div>
                    {renderCard(cardId, index, correct)}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={restart}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {allCorrect ? "Play again" : "Restart"}
          </button>
        </div>
      </div>
    </div>
  );
}
