"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { belongsToPair, type WordPair } from "@/app/lib/types";
import { getLanguageName } from "@/app/lib/languages";
import { CEFR_LEVELS } from "@/app/lib/levels";
import {
  addWord,
  addWordsBulk,
  deleteWord,
  getAllWords,
  updateWord,
} from "@/app/lib/db";
import { shuffle } from "@/app/lib/shuffle";
import AddWordForm, { type NewWordInput } from "./AddWordForm";
import BackupPanel from "./BackupPanel";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import EditWordModal, { type WordEdits } from "./EditWordModal";
import InstallPrompt from "./InstallPrompt";
import LanguagePairSelector from "./LanguagePairSelector";
import MatchGame from "./MatchGame";
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
  const [levelFilter, setLevelFilter] = useState("all");
  const [wordToDelete, setWordToDelete] = useState<WordPair | null>(null);
  const [wordToEdit, setWordToEdit] = useState<WordPair | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showReminderList, setShowReminderList] = useState(false);
  const [showGame, setShowGame] = useState(false);
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

  async function handleAdd({
    sourceText,
    targetText,
    description,
    level,
    isIdiom,
  }: NewWordInput) {
    const word = await addWord({
      langA: sourceLang,
      langB: targetLang,
      textA: sourceText,
      textB: targetText,
      description,
      level,
      isIdiom,
      remindMe: false,
    });
    setWords((prev) => [word, ...prev]);
  }

  async function handleBackupImport(
    entries: {
      langA: string;
      langB: string;
      textA: string;
      textB: string;
      description: string;
      level: string;
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

  function requestEdit(word: WordPair) {
    setWordToEdit(word);
  }

  function cancelEdit() {
    setWordToEdit(null);
  }

  async function saveEdit(id: number, edits: WordEdits) {
    const updated = await updateWord(id, edits);
    setWords((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    setWordToEdit(null);
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
      if (levelFilter === "none" && w.level) return false;
      if (
        levelFilter !== "all" &&
        levelFilter !== "none" &&
        w.level !== levelFilter
      )
        return false;
      if (!query) return true;
      return (
        w.textA.toLowerCase().includes(query) ||
        w.textB.toLowerCase().includes(query)
      );
    });
  }, [pairWords, search, typeFilter, levelFilter]);

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
        <div className="flex flex-wrap items-center gap-3">
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

      <div className="rounded-lg border border-zinc-300 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setAddOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium"
        >
          <span>Add word</span>
          <span className="text-zinc-500">{addOpen ? "−" : "+"}</span>
        </button>
        {addOpen && (
          <div className="flex flex-col gap-4 border-t border-zinc-300 px-4 py-3 dark:border-zinc-700">
            <AddWordForm
              sourceLabel={sourceLabel}
              targetLabel={targetLabel}
              onAdd={handleAdd}
            />
            <BackupPanel words={words} onImport={handleBackupImport} />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-zinc-300 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium"
        >
          <span>Search & filters</span>
          <span className="text-zinc-500">{filtersOpen ? "−" : "+"}</span>
        </button>
        {filtersOpen && (
          <div className="flex flex-col gap-3 border-t border-zinc-300 px-4 py-3 dark:border-zinc-700 sm:flex-row sm:items-center sm:flex-wrap">
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
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              aria-label="Filter by level"
              className="w-fit rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
            >
              <option value="all">All levels</option>
              <option value="none">No level</option>
              {CEFR_LEVELS.map((cefrLevel) => (
                <option key={cefrLevel} value={cefrLevel}>
                  {cefrLevel}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowGame(true)}
              disabled={pairWords.length < 2}
              className="w-fit rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              🎮 Practice
            </button>
          </div>
        )}
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
            onRequestEdit={requestEdit}
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
          onRequestEdit={requestEdit}
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

      {wordToEdit && (
        <EditWordModal
          word={wordToEdit}
          sourceLabel={getLanguageName(wordToEdit.langA)}
          targetLabel={getLanguageName(wordToEdit.langB)}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />
      )}

      {showGame && (
        <MatchGame
          words={pairWords}
          sourceLang={sourceLang}
          onClose={() => setShowGame(false)}
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
