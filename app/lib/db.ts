import type { NewWordPair, WordPair } from "./types";

const DB_NAME = "translations-db";
const DB_VERSION = 1;
const STORE_NAME = "words";

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
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as WordPair[]);
    request.onerror = () => reject(request.error);
  });
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
