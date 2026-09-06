// Browser-side speech + translation, all going through this app's own
// /api/* route handlers so the Google Cloud API key stays on the server.

const TARGET_SAMPLE_RATE = 16000;

// --- Locale tables --------------------------------------------------------

// App language code -> Google Text-to-Speech `languageCode`. Only languages
// Google TTS actually supports are listed; the rest get no speaker button.
const TTS_LOCALE: Record<string, string> = {
  en: "en-US",
  ru: "ru-RU",
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
  he: "he-IL",
  ar: "ar-XA",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  th: "th-TH",
  vi: "vi-VN",
  id: "id-ID",
  ms: "ms-MY",
  zh: "cmn-CN",
  ja: "ja-JP",
  ko: "ko-KR",
  ur: "ur-IN",
  lv: "lv-LV",
  sw: "sw-KE",
  sr: "sr-RS",
};

// App language code -> Google Speech-to-Text `languageCode`. STT covers many
// more languages than TTS, so this table is broader.
const STT_LOCALE: Record<string, string> = {
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
  no: "no-NO",
  da: "da-DK",
  fi: "fi-FI",
  is: "is-IS",
  tr: "tr-TR",
  ka: "ka-GE",
  az: "az-AZ",
  he: "iw-IL",
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
  zh: "cmn-Hans-CN",
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

export function canSpeak(langCode: string): boolean {
  return langCode in TTS_LOCALE;
}

function sttLocale(langCode: string): string {
  return STT_LOCALE[langCode] ?? langCode;
}

// --- Translation ---------------------------------------------------------

export async function translate(
  text: string,
  source: string,
  target: string,
): Promise<string> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.trim(), source, target }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    translation?: string;
    error?: string;
  };
  if (!res.ok) throw new Error(data.error || `Translation failed (${res.status})`);
  return data.translation ?? "";
}

// --- Text to speech ----------------------------------------------------

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.removeAttribute("src");
    currentAudio = null;
  }
}

/** Synthesizes `text` in `langCode` and plays it. Resolves when playback
 * finishes. Starting a new utterance cancels any that's still playing. */
export async function speak(text: string, langCode: string): Promise<void> {
  const languageCode = TTS_LOCALE[langCode];
  const trimmed = text.trim();
  if (!languageCode || !trimmed) return;

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: trimmed, languageCode }),
  });
  if (!res.ok) throw new Error(`Speech synthesis failed (${res.status})`);

  const url = URL.createObjectURL(await res.blob());
  stopSpeaking();
  const audio = new Audio(url);
  currentAudio = audio;
  try {
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Audio playback failed"));
      audio.play().catch(reject);
    });
  } finally {
    URL.revokeObjectURL(url);
    if (currentAudio === audio) currentAudio = null;
  }
}

// --- Speech to text ----------------------------------------------------

export interface TranscriptResult {
  /** What Google heard. Empty when nothing was recognized. */
  text: string;
  /** 0..1 recognition confidence, or null when unavailable. */
  confidence: number | null;
}

/** Sends recorded PCM16 audio to the STT proxy for `langCode`. */
export async function transcribe(
  pcm: Blob,
  langCode: string,
): Promise<TranscriptResult> {
  const res = await fetch(
    `/api/stt?lang=${encodeURIComponent(sttLocale(langCode))}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: pcm,
    },
  );
  const data = (await res.json().catch(() => ({}))) as TranscriptResult & {
    error?: string;
  };
  if (!res.ok) throw new Error(data.error || `Recognition failed (${res.status})`);
  return { text: data.text ?? "", confidence: data.confidence ?? null };
}

// --- Microphone capture -> 16 kHz mono PCM16 --------------------------

export interface Recorder {
  /** Stops capture and returns headerless 16 kHz mono PCM16 audio. */
  stop(): Promise<Blob>;
  /** Stops capture and discards the audio. */
  cancel(): void;
}

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const AudioCtx: typeof AudioContext =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new AudioCtx();
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];

  processor.onaudioprocess = (event) => {
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };
  source.connect(processor);
  // Chrome only runs a ScriptProcessor while it's connected downstream; we
  // never write to the output buffer, so nothing is actually played back.
  processor.connect(ctx.destination);

  const inputRate = ctx.sampleRate;

  function teardown() {
    processor.onaudioprocess = null;
    processor.disconnect();
    source.disconnect();
    stream.getTracks().forEach((track) => track.stop());
    void ctx.close();
  }

  return {
    async stop() {
      teardown();
      const merged = mergeChunks(chunks);
      const downsampled = downsample(merged, inputRate, TARGET_SAMPLE_RATE);
      return new Blob([encodePcm16(downsampled)], {
        type: "application/octet-stream",
      });
    },
    cancel() {
      teardown();
    },
  };
}

// --- Pronunciation scoring --------------------------------------------

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

// --- internals -------------------------------------------------------

function mergeChunks(chunks: Float32Array[]): Float32Array {
  let length = 0;
  for (const chunk of chunks) length += chunk.length;
  const merged = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function downsample(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (toRate >= fromRate) return input;
  const ratio = fromRate / toRate;
  const outLength = Math.round(input.length / ratio);
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      sum += input[j];
      count++;
    }
    output[i] = count ? sum / count : 0;
  }
  return output;
}

function encodePcm16(samples: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  return buffer;
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
