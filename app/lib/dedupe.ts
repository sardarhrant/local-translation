import type { WordPair } from "./types";

/**
 * A duplicate key that's agnostic to which side is "A" vs "B" — a word saved
 * as (en:"hello", ru:"привет") collides with one saved as
 * (ru:"привет", en:"hello").
 */
export function wordDedupeKey(
  langA: string,
  textA: string,
  langB: string,
  textB: string,
): string {
  const sides = [
    { lang: langA, text: textA.trim().toLowerCase() },
    { lang: langB, text: textB.trim().toLowerCase() },
  ].sort((a, b) => a.lang.localeCompare(b.lang) || a.text.localeCompare(b.text));

  return `${sides[0].lang}:${sides[0].text}|${sides[1].lang}:${sides[1].text}`;
}

export function existingDedupeKeys(words: WordPair[]): Set<string> {
  return new Set(
    words.map((w) => wordDedupeKey(w.langA, w.textA, w.langB, w.textB)),
  );
}

/** The fields that make a word pair "the same" for de-duplication. */
export type WordIdentityFields = Pick<
  WordPair,
  "langA" | "langB" | "textA" | "textB"
>;

export function wordIdentity(word: WordIdentityFields): string {
  return wordDedupeKey(word.langA, word.textA, word.langB, word.textB);
}

/** Finds an existing word with the same identity as `candidate`, if any.
 * Both text sides must match, so a word with a different translation is
 * still allowed. */
export function findDuplicate<T extends WordIdentityFields>(
  words: T[],
  candidate: WordIdentityFields,
): T | undefined {
  const key = wordIdentity(candidate);
  return words.find((word) => wordIdentity(word) === key);
}
