"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { WordPair } from "@/app/lib/types";
import { getLanguageName } from "@/app/lib/languages";
import {
  canRecognize,
  canSpeak,
  recognize,
  similarity,
  speak,
  stopSpeaking,
  type RecognitionHandle,
} from "@/app/lib/speech";

interface PronunciationModalProps {
  word: WordPair;
  onClose: () => void;
}

const GOOD_SCORE = 0.8;
const OK_SCORE = 0.5;

export default function PronunciationModal({
  word,
  onClose,
}: PronunciationModalProps) {
  const [side, setSide] = useState<"A" | "B">("A");
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [finalHeard, setFinalHeard] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionHandle | null>(null);

  const expected = side === "A" ? word.textA : word.textB;
  const lang = side === "A" ? word.langA : word.langB;
  const recognitionSupported = canRecognize();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      recognitionRef.current?.stop();
      stopSpeaking();
    };
  }, [onClose]);

  function chooseSide(next: "A" | "B") {
    recognitionRef.current?.stop();
    stopSpeaking();
    setSide(next);
    setListening(false);
    setHeard("");
    setFinalHeard(null);
    setError(null);
  }

  async function handleListen() {
    setError(null);
    try {
      await speak(expected, lang);
    } catch {
      setError("Couldn't play audio.");
    }
  }

  function startListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    setError(null);
    setHeard("");
    setFinalHeard(null);
    setListening(true);
    recognitionRef.current = recognize(lang, {
      onResult: (transcript, isFinal) => {
        setHeard(transcript.text);
        if (isFinal) setFinalHeard(transcript.text);
      },
      onError: (message) => setError(message),
      onEnd: () => {
        setListening(false);
        recognitionRef.current = null;
      },
    });
  }

  const score = finalHeard ? similarity(expected, finalHeard) : 0;
  const verdict =
    score >= GOOD_SCORE ? "good" : score >= OK_SCORE ? "close" : "off";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pronunciation-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between">
          <h2 id="pronunciation-title" className="text-base font-semibold">
            Practice pronunciation
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-xl leading-none text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ×
          </button>
        </div>

        <div className="mt-3 flex rounded-lg border border-zinc-300 p-0.5 text-sm dark:border-zinc-700">
          {(["A", "B"] as const).map((option) => {
            const optionLang = option === "A" ? word.langA : word.langB;
            return (
              <button
                key={option}
                type="button"
                onClick={() => chooseSide(option)}
                className={`flex-1 rounded-md px-3 py-1 font-medium transition-colors ${
                  side === option
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {getLanguageName(optionLang)}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xl font-medium">{expected}</p>

        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={handleListen}
            disabled={!canSpeak() || listening}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            🔊 Listen
          </button>
          <button
            type="button"
            onClick={startListening}
            disabled={!recognitionSupported}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              listening
                ? "bg-red-600 hover:bg-red-700"
                : "bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            }`}
          >
            {listening ? "■ Stop" : "🎤 Speak"}
          </button>
        </div>

        {!recognitionSupported && (
          <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Speech recognition needs Chrome, Edge, or Safari.
          </p>
        )}

        {listening && (
          <p className="mt-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Listening… {heard && <span className="italic">“{heard}”</span>}
          </p>
        )}

        {error && (
          <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {finalHeard !== null && !listening && (
          <div className="mt-4 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-700">
            {finalHeard ? (
              <>
                <p className="text-zinc-500 dark:text-zinc-400">Heard:</p>
                <p className="text-base font-medium">{finalHeard}</p>
                <p
                  className={`mt-2 font-medium ${
                    verdict === "good"
                      ? "text-green-600 dark:text-green-400"
                      : verdict === "close"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {verdict === "good"
                    ? `✓ Great — ${Math.round(score * 100)}% match`
                    : verdict === "close"
                      ? `~ Close — ${Math.round(score * 100)}% match`
                      : `✗ Not quite — ${Math.round(score * 100)}% match`}
                </p>
              </>
            ) : (
              <p className="text-zinc-500 dark:text-zinc-400">
                Didn&apos;t catch that. Try again, a bit louder.
              </p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
