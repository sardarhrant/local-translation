import type { NewWordPair, WordPair } from "./types";

const DB_NAME = "translations-db";
const DB_VERSION = 1;
const STORE_NAME = "words";

interface LegacyWordPair {
  id: number;
  en: string;
  ru: string;
  isIdiom: boolean;
  remindMe: boolean;
  createdAt: number;
}

function isLegacyRecord(raw: unknown): raw is LegacyWordPair {
  const record = raw as Partial<LegacyWordPair & WordPair>;
  return typeof record.en === "string" && typeof record.langA !== "string";
}

function needsMigration(raw: unknown): boolean {
  const record = raw as Partial<WordPair>;
  return isLegacyRecord(raw) || typeof record.description !== "string";
}

function normalizeRecord(raw: unknown): WordPair {
  const base = isLegacyRecord(raw)
    ? {
        id: raw.id,
        langA: "en",
        langB: "ru",
        textA: raw.en,
        textB: raw.ru,
        isIdiom: raw.isIdiom,
        remindMe: raw.remindMe,
        createdAt: raw.createdAt,
      }
    : (raw as WordPair);

  const description = (raw as Partial<WordPair>).description;
  return {
    ...base,
    description: typeof description === "string" ? description : "",
  };
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllWords(): Promise<WordPair[]> {
  const db = await openDB();
  const raw = await new Promise<unknown[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as unknown[]);
    request.onerror = () => reject(request.error);
  });

  const outdated = raw.filter(needsMigration);
  if (outdated.length > 0) {
    void persistMigratedRecords(outdated.map(normalizeRecord));
  }

  return raw.map(normalizeRecord);
}

async function persistMigratedRecords(records: WordPair[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      for (const record of records) store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Best-effort: if this fails, the same records get migrated again on
    // the next load — harmless since normalizeRecord is idempotent.
  }
}

export async function addWord(word: NewWordPair): Promise<WordPair> {
  const db = await openDB();
  const entry = { ...word, createdAt: Date.now() };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const request = tx.objectStore(STORE_NAME).add(entry);
    request.onsuccess = () =>
      resolve({ ...entry, id: request.result as number });
    request.onerror = () => reject(request.error);
  });
}

export async function addWordsBulk(words: NewWordPair[]): Promise<void> {
  if (words.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const createdAt = Date.now();
    for (const word of words) {
      store.add({ ...word, createdAt });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateWord(
  id: number,
  changes: Partial<Omit<WordPair, "id" | "createdAt">>,
): Promise<WordPair> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const updated = { ...(getRequest.result as WordPair), ...changes };
      const putRequest = store.put(updated);
      putRequest.onsuccess = () => resolve(updated);
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function deleteWord(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const request = tx.objectStore(STORE_NAME).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
