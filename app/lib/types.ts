export type Direction = "en-ru" | "ru-en";

export interface WordPair {
  id: number;
  en: string;
  ru: string;
  isIdiom: boolean;
  remindMe: boolean;
  createdAt: number;
}

export type NewWordPair = Pick<WordPair, "en" | "ru" | "isIdiom" | "remindMe">;
