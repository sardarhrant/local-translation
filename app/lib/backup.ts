import type { WordPair } from "./types";

export interface BackupEntry {
  langA: string;
  langB: string;
  textA: string;
  textB: string;
  description: string;
  level: string;
  isIdiom: boolean;
  remindMe: boolean;
}

export interface BackupFile {
  version: number;
  exportedAt: string;
  words: BackupEntry[];
}

export function toBackupEntry(word: WordPair): BackupEntry {
  return {
    langA: word.langA,
    langB: word.langB,
    textA: word.textA,
    textB: word.textB,
    description: word.description,
    level: word.level,
    isIdiom: word.isIdiom,
    remindMe: word.remindMe,
  };
}

/** Serializes `words` to a backup file and triggers a download. */
export function downloadBackup(words: WordPair[]): void {
  const payload: BackupFile = {
    version: 2,
    exportedAt: new Date().toISOString(),
    words: words.map(toBackupEntry),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `translations-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
