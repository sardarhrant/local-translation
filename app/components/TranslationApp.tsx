"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Direction, WordPair } from "@/app/lib/types";
import {
  addWord,
  addWordsBulk,
  deleteWord,
  getAllWords,
  updateWord,
} from "@/app/lib/db";
import { shuffle } from "@/app/lib/shuffle";
import AddWordForm from "./AddWordForm";
import BackupPanel from "./BackupPanel";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ImportPanel from "./ImportPanel";
import InstallPrompt from "./InstallPrompt";
import ReminderListModal from "./ReminderListModal";
import ReminderSettingsPanel from "./ReminderSettings";
import ThemeToggle from "./ThemeToggle";
import Toast from "./Toast";
import WordList from "./WordList";

type TypeFilter = "all" | "idioms" | "starred";

export default function TranslationApp() {
  const [words, setWords] = useState<WordPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<Direction>("en-ru");
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [wordToDelete, setWordToDelete] = useState<WordPair | null>(null);
  const [showReminderList, setShowReminderList] = useState(false);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(
    null,
  );

  useEffect(() => {
    getAllWords()
      .then((loaded) => setWords(shuffle(loaded)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  function toggleDirection() {
    const next: Direction = direction === "en-ru" ? "ru-en" : "en-ru";
    setDirection(next);
    setRevealed(new Set());
  }

  async function handleAdd(en: string, ru: string, isIdiom: boolean) {
    const word = await addWord({ en, ru, isIdiom, remindMe: false });
    setWords((prev) => [word, ...prev]);
  }

  async function handleImport(pairs: { en: string; ru: string }[]) {
    await addWordsBulk(
      pairs.map((pair) => ({ ...pair, isIdiom: false, remindMe: false })),
    );
    const loaded = await getAllWords();
    setWords((prev) => {
      const existingIds = new Set(prev.map((w) => w.id));
      const imported = loaded.filter((w) => !existingIds.has(w.id));
      return [...shuffle(imported), ...prev];
    });
  }

  async function handleBackupImport(
    entries: {
      en: string;
      ru: string;
      isIdiom: boolean;
      remindMe: boolean;
    }[],
  ) {
    await addWordsBulk(entries);
    const loaded = await getAllWords();
    setWords((prev) => {
      const existingIds = new Set(prev.map((w) => w.id));
      const imported = loaded.filter((w) => !existingIds.has(w.id));
      return [...shuffle(imported), ...prev];
    });
  }

  async function handleToggleRemind(word: WordPair) {
    const updated = await updateWord(word.id, { remindMe: !word.remindMe });
    setWords((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  }

  function requestDelete(word: WordPair) {
    setWordToDelete(word);
  }

  function cancelDelete() {
    setWordToDelete(null);
  }

  async function confirmDelete() {
    if (!wordToDelete) return;
    const id = wordToDelete.id;
    await deleteWord(id);
    setWords((prev) => prev.filter((w) => w.id !== id));
    setRevealed((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setWordToDelete(null);
  }

  const handleReminderDue = useCallback((title: string, body: string) => {
    setToast({ title, body });
  }, []);

  function toggleReveal(id: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredWords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return words.filter((w) => {
      if (typeFilter === "idioms" && !w.isIdiom) return false;
      if (typeFilter === "starred" && !w.remindMe) return false;
      if (!query) return true;
      return (
        w.en.toLowerCase().includes(query) || w.ru.toLowerCase().includes(query)
      );
    });
  }, [words, search, typeFilter]);

  const starredWords = useMemo(
    () => words.filter((w) => w.remindMe),
    [words],
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Translations
        </h1>
        <div className="flex items-center gap-2">
          {!loading && <ThemeToggle />}
          <button
            type="button"
            onClick={toggleDirection}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {direction === "en-ru" ? "English → Russian" : "Russian → English"}
          </button>
        </div>
      </header>

      {!loading && <InstallPrompt />}

      <AddWordForm direction={direction} onAdd={handleAdd} />
      <ImportPanel direction={direction} onImport={handleImport} />
      <BackupPanel words={words} onImport={handleBackupImport} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words..."
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
        />
        <div className="flex w-fit rounded-lg border border-zinc-300 p-0.5 text-sm dark:border-zinc-700">
          {(
            [
              { value: "all", label: "All" },
              { value: "idioms", label: "Idioms" },
              { value: "starred", label: "Starred" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTypeFilter(option.value)}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                typeFilter === option.value
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Loading...
        </p>
      ) : (
        <>
          <ReminderSettingsPanel
            starredWords={starredWords}
            direction={direction}
            onOpenReminderList={() => setShowReminderList(true)}
            onReminderDue={handleReminderDue}
          />
          <WordList
            words={filteredWords}
            direction={direction}
            revealed={revealed}
            onToggleReveal={toggleReveal}
            onToggleRemind={handleToggleRemind}
            onRequestDelete={requestDelete}
          />
        </>
      )}

      {showReminderList && (
        <ReminderListModal
          words={starredWords}
          direction={direction}
          revealed={revealed}
          onToggleReveal={toggleReveal}
          onToggleRemind={handleToggleRemind}
          onRequestDelete={requestDelete}
          onClose={() => setShowReminderList(false)}
        />
      )}

      {wordToDelete && (
        <ConfirmDeleteModal
          word={wordToDelete}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}

      {toast && (
        <Toast
          title={toast.title}
          body={toast.body}
          onDismiss={() => setToast(null)}
          onClick={() => {
            setToast(null);
            setShowReminderList(true);
          }}
        />
      )}
    </div>
  );
}
