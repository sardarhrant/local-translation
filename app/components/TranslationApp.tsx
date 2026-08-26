"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { belongsToPair, type WordPair } from "@/app/lib/types";
import { getLanguageName } from "@/app/lib/languages";
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
import LanguagePairSelector from "./LanguagePairSelector";
import ReminderListModal from "./ReminderListModal";
import ReminderSettingsPanel from "./ReminderSettings";
import ThemeToggle from "./ThemeToggle";
import Toast from "./Toast";
import WordList from "./WordList";

type TypeFilter = "all" | "idioms" | "starred";

export default function TranslationApp() {
  const [words, setWords] = useState<WordPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("ru");
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

  function swapLanguages() {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setRevealed(new Set());
  }

  function changeSourceLang(lang: string) {
    setSourceLang(lang);
    setRevealed(new Set());
  }

  function changeTargetLang(lang: string) {
    setTargetLang(lang);
    setRevealed(new Set());
  }

  async function handleAdd(
    sourceText: string,
    targetText: string,
    isIdiom: boolean,
  ) {
    const word = await addWord({
      langA: sourceLang,
      langB: targetLang,
      textA: sourceText,
      textB: targetText,
      isIdiom,
      remindMe: false,
    });
    setWords((prev) => [word, ...prev]);
  }

  async function handleImport(
    pairs: { sourceText: string; targetText: string }[],
  ) {
    await addWordsBulk(
      pairs.map(({ sourceText, targetText }) => ({
        langA: sourceLang,
        langB: targetLang,
        textA: sourceText,
        textB: targetText,
        isIdiom: false,
        remindMe: false,
      })),
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
      langA: string;
      langB: string;
      textA: string;
      textB: string;
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

  const pairWords = useMemo(
    () => words.filter((w) => belongsToPair(w, sourceLang, targetLang)),
    [words, sourceLang, targetLang],
  );

  const filteredWords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pairWords.filter((w) => {
      if (typeFilter === "idioms" && !w.isIdiom) return false;
      if (typeFilter === "starred" && !w.remindMe) return false;
      if (!query) return true;
      return (
        w.textA.toLowerCase().includes(query) ||
        w.textB.toLowerCase().includes(query)
      );
    });
  }, [pairWords, search, typeFilter]);

  const starredWords = useMemo(
    () => words.filter((w) => w.remindMe),
    [words],
  );

  const sourceLabel = getLanguageName(sourceLang);
  const targetLabel = getLanguageName(targetLang);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10 sm:px-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Translations
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {!loading && <ThemeToggle />}
          <LanguagePairSelector
            sourceLang={sourceLang}
            targetLang={targetLang}
            onChangeSource={changeSourceLang}
            onChangeTarget={changeTargetLang}
            onSwap={swapLanguages}
          />
        </div>
      </header>

      {!loading && <InstallPrompt />}

      <AddWordForm
        sourceLabel={sourceLabel}
        targetLabel={targetLabel}
        onAdd={handleAdd}
      />
      <ImportPanel
        sourceLang={sourceLang}
        targetLang={targetLang}
        sourceLabel={sourceLabel}
        targetLabel={targetLabel}
        existingWords={pairWords}
        onImport={handleImport}
      />
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
            onOpenReminderList={() => setShowReminderList(true)}
            onReminderDue={handleReminderDue}
          />
          <WordList
            words={filteredWords}
            sourceLang={sourceLang}
            sourceLabel={sourceLabel}
            targetLabel={targetLabel}
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
