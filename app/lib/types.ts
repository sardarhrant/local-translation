export interface WordPair {
  id: number;
  langA: string;
  langB: string;
  textA: string;
  textB: string;
  isIdiom: boolean;
  remindMe: boolean;
  createdAt: number;
}

export type NewWordPair = Pick<
  WordPair,
  "langA" | "langB" | "textA" | "textB" | "isIdiom" | "remindMe"
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
