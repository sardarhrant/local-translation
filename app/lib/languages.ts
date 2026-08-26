export interface Language {
  code: string;
  name: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "ru", name: "Russian" },
  { code: "hy", name: "Armenian" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "uk", name: "Ukrainian" },
  { code: "cs", name: "Czech" },
  { code: "sk", name: "Slovak" },
  { code: "ro", name: "Romanian" },
  { code: "hu", name: "Hungarian" },
  { code: "bg", name: "Bulgarian" },
  { code: "el", name: "Greek" },
  { code: "sv", name: "Swedish" },
  { code: "no", name: "Norwegian" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "is", name: "Icelandic" },
  { code: "tr", name: "Turkish" },
  { code: "ka", name: "Georgian" },
  { code: "az", name: "Azerbaijani" },
  { code: "he", name: "Hebrew" },
  { code: "ar", name: "Arabic" },
  { code: "fa", name: "Persian" },
  { code: "ur", name: "Urdu" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "ta", name: "Tamil" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "sr", name: "Serbian" },
  { code: "hr", name: "Croatian" },
  { code: "sl", name: "Slovenian" },
  { code: "lt", name: "Lithuanian" },
  { code: "lv", name: "Latvian" },
  { code: "et", name: "Estonian" },
  { code: "sq", name: "Albanian" },
  { code: "mk", name: "Macedonian" },
  { code: "kk", name: "Kazakh" },
  { code: "uz", name: "Uzbek" },
  { code: "sw", name: "Swahili" },
];

const LANGUAGE_BY_CODE = new Map(LANGUAGES.map((lang) => [lang.code, lang]));

export function getLanguageName(code: string): string {
  return LANGUAGE_BY_CODE.get(code)?.name ?? code;
}
