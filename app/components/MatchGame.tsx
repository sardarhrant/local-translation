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
  fromSlotId: number | null;
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

export default function MatchGame({ words, sourceLang, onClose }: MatchGameProps) {
  const [roundWords, setRoundWords] = useState<WordPair[]>(() => pickRound(words));
  const [trayOrder, setTrayOrder] = useState<number[]>(() =>
    shuffle(roundWords.map((w) => w.id)),
  );
  const [placements, setPlacements] = useState<Record<number, number>>({});
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
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

  const placedIds = useMemo(() => new Set(Object.values(placements)), [placements]);
  const trayVisible = trayOrder.filter((id) => !placedIds.has(id));

  const allFilled =
    roundWords.length > 0 &&
    roundWords.every((w) => placements[w.id] !== undefined);
  const allCorrect =
    allFilled && roundWords.every((w) => placements[w.id] === w.id);

  function restart() {
    const next = pickRound(words);
    setRoundWords(next);
    setTrayOrder(shuffle(next.map((w) => w.id)));
    setPlacements({});
    setSelectedCardId(null);
  }

  function placeCard(slotId: number, cardId: number, fromSlotId: number | null) {
    setPlacements((prev) => {
      const next = { ...prev };
      if (fromSlotId !== null) delete next[fromSlotId];
      next[slotId] = cardId;
      return next;
    });
  }

  function removeFromSlot(slotId: number) {
    setPlacements((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  }

  function handleCardTap(cardId: number, fromSlotId: number | null) {
    if (selectedCardId === cardId) {
      setSelectedCardId(null);
      return;
    }
    if (fromSlotId !== null) {
      removeFromSlot(fromSlotId);
    }
    setSelectedCardId(cardId);
  }

  function handleSlotTap(slotId: number) {
    if (selectedCardId === null) return;
    const fromEntry = Object.entries(placements).find(
      ([, cardId]) => cardId === selectedCardId,
    );
    placeCard(
      slotId,
      selectedCardId,
      fromEntry ? Number(fromEntry[0]) : null,
    );
    setSelectedCardId(null);
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLElement>,
    cardId: number,
    fromSlotId: number | null,
  ) {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedCardId(null);
    const state: DragState = {
      cardId,
      fromSlotId,
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
    const distanceFromStart = Math.hypot(
      event.clientX - current.startX,
      event.clientY - current.startY,
    );
    const moved = current.moved || distanceFromStart > TAP_MOVE_THRESHOLD;
    const next: DragState = {
      ...current,
      x: event.clientX,
      y: event.clientY,
      moved,
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
      handleCardTap(current.cardId, current.fromSlotId);
      return;
    }

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const slotEl =
      target instanceof Element ? target.closest("[data-slot-id]") : null;
    const slotId = slotEl ? Number(slotEl.getAttribute("data-slot-id")) : null;

    if (slotId !== null && !Number.isNaN(slotId)) {
      placeCard(slotId, current.cardId, current.fromSlotId);
    } else if (current.fromSlotId !== null) {
      removeFromSlot(current.fromSlotId);
    }
  }

  function renderCard(cardId: number, fromSlotId: number | null, correct: boolean | null) {
    const isDragging = drag?.cardId === cardId;
    const isSelected = selectedCardId === cardId;
    const text = displayById.get(cardId)?.targetText ?? "";

    return (
      <div
        key={cardId}
        onPointerDown={(e) => handlePointerDown(e, cardId, fromSlotId)}
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
        className={`w-fit min-w-[8rem] cursor-grab select-none rounded-lg border px-3 py-2 text-sm shadow-sm active:cursor-grabbing ${
          correct === true
            ? "border-green-400 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300"
            : correct === false
              ? "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
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
            Practice: match the words
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
                <span>
                  All {roundWords.length} matched correctly! Nice work.
                </span>
              </div>
            )}

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Drag a card from the right onto its matching word on the left
              (or tap a card, then tap the slot).
            </p>

            <div className="grid grid-cols-2 gap-6 overflow-y-auto">
              <div className="flex flex-col gap-2">
                {roundWords.map((word) => {
                  const placedId = placements[word.id];
                  const isFilled = placedId !== undefined;
                  const correct = isFilled ? placedId === word.id : null;

                  return (
                    <div key={word.id} className="flex flex-col gap-1">
                      <div className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                        {displayById.get(word.id)?.sourceText}
                      </div>
                      <div
                        data-slot-id={word.id}
                        onClick={() => handleSlotTap(word.id)}
                        className={`flex min-h-[2.75rem] items-center rounded-lg border-2 border-dashed px-2 py-1 transition-colors ${
                          isFilled
                            ? correct
                              ? "border-green-400 bg-green-50/50 dark:border-green-700"
                              : "border-red-300 bg-red-50/50 dark:border-red-800"
                            : "border-zinc-300 dark:border-zinc-700"
                        }`}
                      >
                        {isFilled &&
                          renderCard(placedId, word.id, correct)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap content-start gap-2">
                {trayVisible.map((id) => renderCard(id, null, null))}
                {trayVisible.length === 0 && !allCorrect && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    All cards placed — fix any red ones above.
                  </p>
                )}
              </div>
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
