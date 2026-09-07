"use client";

import { useRef, useState } from "react";
import type { WordPair } from "@/app/lib/types";
import { wordDedupeKey, existingDedupeKeys } from "@/app/lib/dedupe";
import { downloadBackup, type BackupEntry, type BackupFile } from "@/app/lib/backup";

interface BackupPanelProps {
  words: WordPair[];
  onImport: (entries: BackupEntry[]) => void;
}

function parseBackupEntries(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { words?: unknown }).words)
  ) {
    return (parsed as BackupFile).words;
  }
  return [];
}

export default function BackupPanel({ words, onImport }: BackupPanelProps) {
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    downloadBackup(words);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    let entries: unknown[];
    try {
      entries = parseBackupEntries(JSON.parse(await file.text()));
    } catch {
      setResult({ imported: 0, skipped: 0 });
      return;
    }

    const existingKeys = existingDedupeKeys(words);
    const toImport: BackupEntry[] = [];
    let skipped = 0;

    for (const raw of entries) {
      const entry = raw as Record<string, unknown> | null;
      // Support both the current {langA, langB, textA, textB} shape and the
      // older {en, ru} backup format from before multi-language support.
      const langA =
        typeof entry?.langA === "string"
          ? entry.langA
          : typeof entry?.en === "string"
            ? "en"
            : "";
      const langB =
        typeof entry?.langB === "string"
          ? entry.langB
          : typeof entry?.ru === "string"
            ? "ru"
            : "";
      const textA =
        typeof entry?.textA === "string"
          ? entry.textA.trim()
          : typeof entry?.en === "string"
            ? entry.en.trim()
            : "";
      const textB =
        typeof entry?.textB === "string"
          ? entry.textB.trim()
          : typeof entry?.ru === "string"
            ? entry.ru.trim()
            : "";

      if (!langA || !langB || !textA || !textB) {
        skipped++;
        continue;
      }

      const key = wordDedupeKey(langA, textA, langB, textB);
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }

      existingKeys.add(key);
      toImport.push({
        langA,
        langB,
        textA,
        textB,
        description:
          typeof entry?.description === "string"
            ? entry.description.trim()
            : "",
        level: typeof entry?.level === "string" ? entry.level.trim() : "",
        isIdiom: entry?.isIdiom === true,
        remindMe: entry?.remindMe === true,
      });
    }

    if (toImport.length > 0) onImport(toImport);
    setResult({ imported: toImport.length, skipped });
  }

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-300 pt-3 dark:border-zinc-700">
      <p className="text-sm font-medium">Export / Import backup</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Export your whole word list (every language pair) as a file you can
        keep as a backup or bring into another browser. Importing skips
        anything that&apos;s already in your list.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={words.length === 0}
          className="w-fit rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Export ({words.length})
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-fit rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          className="hidden"
        />
        {result && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Imported {result.imported}
            {result.skipped > 0 ? `, skipped ${result.skipped}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}
