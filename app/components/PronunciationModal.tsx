"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { WordPair } from "@/app/lib/types";
import { getLanguageName } from "@/app/lib/languages";
import {
  canSpeak,
  similarity,
  speak,
  startRecording,
  stopSpeaking,
  transcribe,
  type Recorder,
  type TranscriptResult,
} from "@/app/lib/speech";

interface PronunciationModalProps {
  word: WordPair;
  onClose: () => void;
}

type Phase = "idle" | "recording" | "processing" | "done";

const GOOD_SCORE = 0.8;
const OK_SCORE = 0.5;

export default function PronunciationModal({
  word,
  onClose,
}: PronunciationModalProps) {
  const [side, setSide] = useState<"A" | "B">("A");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<Recorder | null>(null);

  const expected = side === "A" ? word.textA : word.textB;
  const lang = side === "A" ? word.langA : word.langB;

  function chooseSide(next: "A" | "B") {
    recorderRef.current?.cancel();
    recorderRef.current = null;
    stopSpeaking();
    setSide(next);
    setPhase("idle");
    setResult(null);
    setError(null);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      stopSpeaking();
      recorderRef.current?.cancel();
    };
  }, [onClose]);

  async function handleListen() {
    setError(null);
    try {
      await speak(expected, lang);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not play audio");
    }
  }

  async function startRec() {
    setError(null);
    setResult(null);
    try {
      recorderRef.current = await startRecording();
      setPhase("recording");
    } catch {
      setError("Microphone access was denied.");
    }
  }

  async function stopRec() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    setPhase("processing");
    try {
      const wav = await recorder.stop();
      const transcript = await transcribe(wav, lang);
      setResult(transcript);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recognition failed");
      setPhase("idle");
    }
  }

  const score = result ? similarity(expected, result.text) : 0;
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
            disabled={!canSpeak(lang) || phase === "recording"}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            🔊 Listen
          </button>
          {phase === "recording" ? (
            <button
              type="button"
              onClick={stopRec}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              ■ Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={startRec}
              disabled={phase === "processing"}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              🎤 {phase === "processing" ? "Checking…" : "Record"}
            </button>
          )}
        </div>

        {phase === "recording" && (
          <p className="mt-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Listening… say the word, then tap Stop.
          </p>
        )}

        {error && (
          <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {phase === "done" && result && (
          <div className="mt-4 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-700">
            {result.text ? (
              <>
                <p className="text-zinc-500 dark:text-zinc-400">Heard:</p>
                <p className="text-base font-medium">{result.text}</p>
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
