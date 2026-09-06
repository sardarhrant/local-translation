// Speech via the browser's built-in Web Speech API — free, keyless, no
// server. Recognition works in Chrome/Edge (desktop + Android) and Safari;
// synthesis is supported almost everywhere. Firefox has neither.

// --- Minimal Web Speech typings (not in lib.dom.d.ts) -----------------

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventLike extends Event {
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canRecognize(): boolean {
  return recognitionCtor() !== null;
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// --- Locale map: app 2-letter code -> BCP-47 --------------------------

const LOCALE: Record<string, string> = {
  en: "en-US",
  ru: "ru-RU",
  hy: "hy-AM",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
  nl: "nl-NL",
  pl: "pl-PL",
  uk: "uk-UA",
  cs: "cs-CZ",
  sk: "sk-SK",
  ro: "ro-RO",
  hu: "hu-HU",
  bg: "bg-BG",
  el: "el-GR",
  sv: "sv-SE",
  no: "nb-NO",
  da: "da-DK",
  fi: "fi-FI",
  is: "is-IS",
  tr: "tr-TR",
  ka: "ka-GE",
  az: "az-AZ",
  he: "he-IL",
  ar: "ar-SA",
  fa: "fa-IR",
  ur: "ur-PK",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  th: "th-TH",
  vi: "vi-VN",
  id: "id-ID",
  ms: "ms-MY",
  zh: "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
  sr: "sr-RS",
  hr: "hr-HR",
  sl: "sl-SI",
  lt: "lt-LT",
  lv: "lv-LV",
  et: "et-EE",
  sq: "sq-AL",
  mk: "mk-MK",
  kk: "kk-KZ",
  uz: "uz-UZ",
  sw: "sw-TZ",
};

function toLocale(langCode: string): string {
  return LOCALE[langCode] ?? langCode;
}

// --- Speech synthesis -------------------------------------------------

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}

/** Speaks `text` in `langCode`. Resolves when playback finishes (or fails
 * silently). A new call cancels any utterance still playing. */
export function speak(text: string, langCode: string): Promise<void> {
  return new Promise((resolve) => {
    const trimmed = text.trim();
    if (!canSpeak() || !trimmed) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.lang = toLocale(langCode);
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

// --- Speech recognition ---------------------------------------------

export interface Transcript {
  text: string;
  /** 0..1 for a final result, null while interim or unavailable. */
  confidence: number | null;
}

export interface RecognitionHandle {
  /** Stop listening; the final `onResult` (if any) and `onEnd` still fire. */
  stop(): void;
}

interface RecognitionHandlers {
  onResult: (transcript: Transcript, isFinal: boolean) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  "no-speech": "Didn't hear anything — try again.",
  "audio-capture": "No microphone found.",
  "not-allowed": "Microphone access was blocked.",
  "service-not-allowed": "Speech recognition was blocked.",
  network: "Network error reaching the speech service.",
  aborted: "Listening stopped.",
};

/** Starts a single recognition pass in `langCode`. It stops on its own when
 * you pause speaking. */
export function recognize(
  langCode: string,
  handlers: RecognitionHandlers,
): RecognitionHandle {
  const Ctor = recognitionCtor();
  if (!Ctor) {
    handlers.onError("Speech recognition isn't supported in this browser.");
    handlers.onEnd();
    return { stop() {} };
  }

  const recognition = new Ctor();
  recognition.lang = toLocale(langCode);
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1];
    const alternative = result[0];
    handlers.onResult(
      {
        text: alternative.transcript.trim(),
        confidence: result.isFinal ? alternative.confidence || null : null,
      },
      result.isFinal,
    );
  };
  recognition.onerror = (event) => {
    handlers.onError(ERROR_MESSAGES[event.error] ?? "Recognition failed.");
  };
  recognition.onend = () => handlers.onEnd();

  try {
    recognition.start();
  } catch {
    handlers.onError("Could not start listening.");
    handlers.onEnd();
  }

  return {
    stop() {
      try {
        recognition.stop();
      } catch {
        // already stopped
      }
    },
  };
}

// --- Pronunciation scoring ----------------------------------------

/** Lowercase, strip diacritics and punctuation, collapse whitespace. */
export function normalizeForCompare(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 0..1 closeness of `heard` to `expected` after normalization. */
export function similarity(expected: string, heard: string): number {
  const a = normalizeForCompare(expected);
  const b = normalizeForCompare(heard);
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = temp;
    }
  }
  return row[b.length];
}
