export interface WordPair {
  id: number;
  langA: string;
  langB: string;
  textA: string;
  textB: string;
  description: string;
  level: string;
  isIdiom: boolean;
  remindMe: boolean;
  createdAt: number;
}

export type NewWordPair = Pick<
  WordPair,
  | "langA"
  | "langB"
  | "textA"
  | "textB"
  | "description"
  | "level"
  | "isIdiom"
  | "remindMe"
>;

/** How a word pair should be shown for a given "I'm looking from this language" choice. */
export interface DisplayText {
  sourceLang: string;
  sourceText: string;
  targetLang: string;
  targetText: string;
}

export function getDisplayText(
  word: WordPair,
  sourceLang: string | null,
): DisplayText {
  if (sourceLang === word.langB) {
    return {
      sourceLang: word.langB,
      sourceText: word.textB,
      targetLang: word.langA,
      targetText: word.textA,
    };
  }
  return {
    sourceLang: word.langA,
    sourceText: word.textA,
    targetLang: word.langB,
    targetText: word.textB,
  };
}

export function belongsToPair(
  word: WordPair,
  langA: string,
  langB: string,
): boolean {
  return (
    (word.langA === langA && word.langB === langB) ||
    (word.langA === langB && word.langB === langA)
  );
}

/** The four fields that make a word pair "the same" for de-duplication. */
export type WordIdentityFields = Pick<
  WordPair,
  "langA" | "langB" | "textA" | "textB"
>;

function sideKey(text: string, lang: string): string {
  return `${lang}:${text.trim().toLowerCase()}`;
}

/** A direction-independent key: (dog/en ↔ собака/ru) matches whichever side
 * was entered first. Both text sides must match to count as a duplicate,
 * so a word with a different translation is still allowed. */
export function wordIdentity(word: WordIdentityFields): string {
  return [sideKey(word.textA, word.langA), sideKey(word.textB, word.langB)]
    .sort()
    .join("|");
}

export function findDuplicate<T extends WordIdentityFields>(
  words: T[],
  candidate: WordIdentityFields,
): T | undefined {
  const key = wordIdentity(candidate);
  return words.find((word) => wordIdentity(word) === key);
}
